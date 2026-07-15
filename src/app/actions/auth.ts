"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword, requireUser } from "@/lib/auth";

export interface ActionState {
  error?: string;
}

const registroSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es muy corto"),
  email: z.email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function registerAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registroSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { nombre, email, password } = parsed.data;

  const existente = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existente) {
    return { error: "Ya existe una cuenta con ese correo" };
  }

  const user = await prisma.user.create({
    data: { nombre, email: email.toLowerCase(), passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect("/empresas");
}

const loginSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos" };
  }
  await createSession(user.id);
  redirect("/empresas");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, "Ingresa tu contraseña actual"),
    passwordNueva: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    passwordConfirmacion: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.passwordNueva === data.passwordConfirmacion, {
    message: "Las contraseñas nuevas no coinciden",
    path: ["passwordConfirmacion"],
  });

export interface CambiarPasswordState {
  error?: string;
  ok?: boolean;
}

export async function cambiarPasswordAction(
  _prevState: CambiarPasswordState,
  formData: FormData
): Promise<CambiarPasswordState> {
  const user = await requireUser();

  const parsed = cambiarPasswordSchema.safeParse({
    passwordActual: formData.get("passwordActual"),
    passwordNueva: formData.get("passwordNueva"),
    passwordConfirmacion: formData.get("passwordConfirmacion"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const valida = await verifyPassword(parsed.data.passwordActual, user.passwordHash);
  if (!valida) {
    return { error: "Tu contraseña actual no es correcta" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.passwordNueva) },
  });

  return { ok: true };
}
