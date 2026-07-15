import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default async function CuentaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Mi cuenta</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {user.nombre} · {user.email}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Cambiar contraseña</h2>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
