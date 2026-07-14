import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegistroForm } from "@/components/auth/RegistroForm";

export default async function RegistroPage() {
  const user = await getCurrentUser();
  if (user) redirect("/empresas");

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-semibold text-neutral-900">Crear cuenta</h1>
      <p className="mt-1 text-sm text-neutral-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-neutral-900 underline">
          Ingresa aquí
        </Link>
        .
      </p>
      <div className="mt-6">
        <RegistroForm />
      </div>
    </div>
  );
}
