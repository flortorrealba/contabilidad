import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/empresas");

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-semibold text-neutral-900">Ingresar</h1>
      <p className="mt-1 text-sm text-neutral-600">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-neutral-900 underline">
          Crea una aquí
        </Link>
        .
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
