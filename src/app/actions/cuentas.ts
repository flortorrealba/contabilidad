"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEmpresaAccess } from "@/lib/auth";
import { isCategoria } from "@/lib/clasificacion";

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
