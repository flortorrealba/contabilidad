"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEmpresaAccess } from "@/lib/auth";
import { parseLibroDiario } from "@/lib/libro-diario-parser";
import { sugerirSeccionPL } from "@/lib/clasificacion-default";
import type { ActionState } from "./auth";

const TOLERANCIA = 1;
const TAMANO_LOTE = 500;

export async function uploadCierreAction(
  empresaId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  await requireEmpresaAccess(user.id, empresaId);

  const archivo = formData.get("archivo");
  const nombreCierre = formData.get("nombre");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Debes adjuntar un archivo Excel (.xlsx, .xlsm) o CSV con el libro diario" };
  }

  let cierreId: string;
  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const resultado = parseLibroDiario(buffer, archivo.name);

    if (resultado.asientos.length === 0) {
      return { error: "No se encontraron asientos válidos en el archivo" };
    }

    const nombresCuentas = Array.from(new Set(resultado.asientos.map((a) => a.cuentaNombre)));
    const codigoPorNombre = new Map<string, string | null>();
    for (const a of resultado.asientos) {
      if (!codigoPorNombre.has(a.cuentaNombre)) codigoPorNombre.set(a.cuentaNombre, a.cuentaCodigo);
    }

    const cuentasExistentes = await prisma.cuenta.findMany({
      where: { empresaId, nombre: { in: nombresCuentas } },
    });
    const mapaCuentas = new Map(cuentasExistentes.map((c) => [c.nombre, c]));

    const nombresNuevos = nombresCuentas.filter((n) => !mapaCuentas.has(n));
    if (nombresNuevos.length > 0) {
      await prisma.cuenta.createMany({
        data: nombresNuevos.map((nombre) => ({
          empresaId,
          nombre,
          codigo: codigoPorNombre.get(nombre) ?? null,
          seccionPL: sugerirSeccionPL(nombre),
        })),
      });
      const creadas = await prisma.cuenta.findMany({ where: { empresaId, nombre: { in: nombresNuevos } } });
      for (const c of creadas) mapaCuentas.set(c.nombre, c);
    }

    const fechas = resultado.asientos.map((a) => a.fecha.getTime());
    const fechaDesde = new Date(Math.min(...fechas));
    const fechaHasta = new Date(Math.max(...fechas));
    const totalDebe = resultado.asientos.reduce((s, a) => s + a.debe, 0);
    const totalHaber = resultado.asientos.reduce((s, a) => s + a.haber, 0);
    const cuadra = Math.abs(totalDebe - totalHaber) < TOLERANCIA;

    const nombreFinal =
      typeof nombreCierre === "string" && nombreCierre.trim()
        ? nombreCierre.trim()
        : `${fechaDesde.toISOString().slice(0, 10)} a ${fechaHasta.toISOString().slice(0, 10)}`;

    const cierre = await prisma.cierre.create({
      data: {
        empresaId,
        nombre: nombreFinal,
        fechaDesde,
        fechaHasta,
        archivoOrigen: archivo.name,
        estado: cuadra ? "CERRADO" : "BORRADOR",
        cuadra,
        totalDebe,
        totalHaber,
        creadoPorId: user.id,
      },
    });
    cierreId = cierre.id;

    for (let i = 0; i < resultado.asientos.length; i += TAMANO_LOTE) {
      const lote = resultado.asientos.slice(i, i + TAMANO_LOTE);
      await prisma.asiento.createMany({
        data: lote.map((a) => ({
          cierreId: cierre.id,
          cuentaId: mapaCuentas.get(a.cuentaNombre)!.id,
          fecha: a.fecha,
          mes: a.mes,
          tipo: a.tipo,
          numeroVoucher: a.numeroVoucher,
          numeroDocto: a.numeroDocto,
          glosa: a.glosa,
          debe: a.debe,
          haber: a.haber,
        })),
      });
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo procesar el archivo" };
  }

  redirect(`/empresas/${empresaId}/cierres/${cierreId}`);
}

export async function deleteCierreAction(formData: FormData) {
  const user = await requireUser();
  const empresaId = String(formData.get("empresaId"));
  const cierreId = String(formData.get("cierreId"));
  await requireEmpresaAccess(user.id, empresaId);

  const cierre = await prisma.cierre.findUnique({ where: { id: cierreId } });
  if (!cierre || cierre.empresaId !== empresaId) {
    throw new Error("Cierre no encontrado");
  }
  await prisma.cierre.delete({ where: { id: cierreId } });
  redirect(`/empresas/${empresaId}/cierres`);
}
