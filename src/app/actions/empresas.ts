"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEmpresaAccess } from "@/lib/auth";
import type { ActionState } from "./auth";

const empresaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre de la empresa es muy corto"),
  rut: z.string().trim().optional(),
});

export async function createEmpresaAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = empresaSchema.safeParse({
    nombre: formData.get("nombre"),
    rut: formData.get("rut") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const empresa = await prisma.empresa.create({
    data: {
      nombre: parsed.data.nombre,
      rut: parsed.data.rut || null,
      members: { create: { userId: user.id, rol: "ADMIN" } },
    },
  });

  redirect(`/empresas/${empresa.id}/cierres`);
}

export async function updateEmpresaAction(
  empresaId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  await requireEmpresaAccess(user.id, empresaId);

  const parsed = empresaSchema.safeParse({
    nombre: formData.get("nombre"),
    rut: formData.get("rut") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { nombre: parsed.data.nombre, rut: parsed.data.rut || null },
  });

  revalidatePath(`/empresas/${empresaId}`, "layout");
  return {};
}

const miembroSchema = z.object({
  email: z.email("Correo inválido"),
});

export async function addMemberAction(
  empresaId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  await requireEmpresaAccess(user.id, empresaId);

  const parsed = miembroSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const invitado = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!invitado) {
    return { error: "No existe un usuario registrado con ese correo. Debe crear su cuenta primero." };
  }

  const yaEsMiembro = await prisma.empresaMember.findUnique({
    where: { userId_empresaId: { userId: invitado.id, empresaId } },
  });
  if (yaEsMiembro) {
    return { error: "Ese usuario ya es miembro de la empresa" };
  }

  await prisma.empresaMember.create({
    data: { userId: invitado.id, empresaId, rol: "MIEMBRO" },
  });

  revalidatePath(`/empresas/${empresaId}/miembros`);
  return {};
}
