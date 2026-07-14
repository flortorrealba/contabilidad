import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateEmpresaForm } from "@/components/empresas/CreateEmpresaForm";

export default async function EmpresasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.empresaMember.findMany({
    where: { userId: user.id },
    include: { empresa: { include: { _count: { select: { cierres: true } } } } },
    orderBy: { empresa: { nombre: "asc" } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Tus empresas</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Selecciona una empresa para subir su libro diario o crea una nueva.
        </p>
      </div>

      {memberships.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no perteneces a ninguna empresa.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
          {memberships.map(({ empresa, rol }) => (
            <li key={empresa.id}>
              <Link
                href={`/empresas/${empresa.id}/cierres`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-neutral-900">{empresa.nombre}</p>
                  <p className="text-xs text-neutral-500">
                    {empresa.rut ? `${empresa.rut} · ` : ""}
                    {empresa._count.cierres} cierre{empresa._count.cierres === 1 ? "" : "s"} · rol {rol.toLowerCase()}
                  </p>
                </div>
                <span className="text-neutral-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Crear nueva empresa</h2>
        <div className="mt-3">
          <CreateEmpresaForm />
        </div>
      </div>
    </div>
  );
}
