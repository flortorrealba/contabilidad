"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEmpresaAccess } from "@/lib/auth";
import { isCategoria } from "@/lib/clasificacion";
import { sugerirCategoria } from "@/lib/clasificacion-default";

export async function updateCuentaCategoriaAction(formData: FormData) {
  const user = await requireUser();
  const empresaId = String(formData.get("empresaId"));
  const cuentaId = String(formData.get("cuentaId"));
  const categoria = String(formData.get("categoria"));

  await requireEmpresaAccess(user.id, empresaId);

  if (!isCategoria(categoria)) {
    throw new Error("Categoría inválida");
  }

  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
  if (!cuenta || cuenta.empresaId !== empresaId) {
    throw new Error("Cuenta no encontrada");
  }

  await prisma.cuenta.update({ where: { id: cuentaId }, data: { categoria } });
  revalidatePath(`/empresas/${empresaId}/cuentas`);
}

// Reclasifica automáticamente las cuentas "Sin clasificar" usando el diccionario
// actual de clasificación por defecto. Nunca toca cuentas que ya tengan una
// categoría asignada (manual o automáticamente en una subida anterior).
export async function reclasificarAutomaticamenteAction(formData: FormData) {
  const user = await requireUser();
  const empresaId = String(formData.get("empresaId"));
  await requireEmpresaAccess(user.id, empresaId);

  const sinClasificar = await prisma.cuenta.findMany({
    where: { empresaId, categoria: "SIN_CLASIFICAR" },
  });

  let actualizadas = 0;
  for (const cuenta of sinClasificar) {
    const sugerida = sugerirCategoria(cuenta.nombre);
    if (sugerida !== "SIN_CLASIFICAR") {
      await prisma.cuenta.update({ where: { id: cuenta.id }, data: { categoria: sugerida } });
      actualizadas++;
    }
  }

  revalidatePath(`/empresas/${empresaId}/cuentas`);
  return { actualizadas, revisadas: sinClasificar.length };
}
