import { prisma } from "@/lib/prisma";
import { AddMemberForm } from "@/components/empresas/AddMemberForm";

export default async function MiembrosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: empresaId } = await params;

  const miembros = await prisma.empresaMember.findMany({
    where: { empresaId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
        {miembros.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-neutral-900">{m.user.nombre}</p>
              <p className="text-xs text-neutral-500">{m.user.email}</p>
            </div>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
              {m.rol}
            </span>
          </li>
        ))}
      </ul>

      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Agregar miembro</h2>
        <p className="mt-1 text-xs text-neutral-500">
          El usuario debe tener una cuenta creada previamente en la aplicación.
        </p>
        <div className="mt-3">
          <AddMemberForm empresaId={empresaId} />
        </div>
      </div>
    </div>
  );
}
