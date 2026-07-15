"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEmpresaAccess } from "@/lib/auth";
import { parsearBalanceExterno, parsearAuxiliarExterno } from "@/lib/icontador-parser";

export interface ValidacionState {
  error?: string;
  ok?: boolean;
}

async function cierreDeEmpresa(cierreId: string, empresaId: string) {
  const cierre = await prisma.cierre.findUnique({ where: { id: cierreId } });
  if (!cierre || cierre.empresaId !== empresaId) throw new Error("Cierre no encontrado");
  return cierre;
}

export async function uploadValidacionBalanceAction(
  empresaId: string,
  cierreId: string,
  _prevState: ValidacionState,
  formData: FormData
): Promise<ValidacionState> {
  const user = await requireUser();
  await requireEmpresaAccess(user.id, empresaId);
  await cierreDeEmpresa(cierreId, empresaId);

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Debes adjuntar el archivo de Balance/Mayor que exporta iContador" };
  }

  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const filas = parsearBalanceExterno(buffer);

    await prisma.$transaction([
      prisma.validacionExterna.deleteMany({ where: { cierreId, tipo: "BALANCE" } }),
      prisma.validacionExterna.create({
        data: {
          cierreId,
          tipo: "BALANCE",
          archivoOrigen: archivo.name,
          datos: filas as unknown as object,
        },
      }),
    ]);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo procesar el archivo" };
  }

  revalidatePath(`/empresas/${empresaId}/cierres/${cierreId}`);
  return { ok: true };
}

export async function uploadValidacionAuxiliarAction(
  empresaId: string,
  cierreId: string,
  _prevState: ValidacionState,
  formData: FormData
): Promise<ValidacionState> {
  const user = await requireUser();
  await requireEmpresaAccess(user.id, empresaId);
  await cierreDeEmpresa(cierreId, empresaId);

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Debes adjuntar el reporte de Facturas u Honorarios Pendientes de Pago que exporta iContador" };
  }

  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const resultado = parsearAuxiliarExterno(buffer);

    await prisma.$transaction([
      prisma.validacionExterna.deleteMany({
        where: { cierreId, tipo: "AUXILIAR", cuentaCodigo: resultado.cuentaCodigo },
      }),
      prisma.validacionExterna.create({
        data: {
          cierreId,
          tipo: "AUXILIAR",
          archivoOrigen: archivo.name,
          cuentaCodigo: resultado.cuentaCodigo,
          cuentaNombre: resultado.cuentaNombre,
          datos: resultado as unknown as object,
        },
      }),
    ]);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo procesar el archivo" };
  }

  revalidatePath(`/empresas/${empresaId}/cierres/${cierreId}`);
  return { ok: true };
}
