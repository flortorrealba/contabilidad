"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEmpresaAccess } from "@/lib/auth";
import { isSeccionPL } from "@/lib/pl-secciones";

export async function updateCuentaSeccionAction(formData: FormData) {
  const user = await requireUser();
  const empresaId = String(formData.get("empresaId"));
  const cuentaId = String(formData.get("cuentaId"));
  const seccionPL = String(formData.get("seccionPL"));

  await requireEmpresaAccess(user.id, empresaId);

  if (!isSeccionPL(seccionPL)) {
    throw new Error("Sección de P&L inválida");
  }

  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
  if (!cuenta || cuenta.empresaId !== empresaId) {
    throw new Error("Cuenta no encontrada");
  }

  await prisma.cuenta.update({ where: { id: cuentaId }, data: { seccionPL } });
  revalidatePath(`/empresas/${empresaId}/cuentas`);
}
