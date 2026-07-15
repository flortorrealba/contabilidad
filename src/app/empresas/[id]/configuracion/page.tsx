import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditEmpresaForm } from "@/components/empresas/EditEmpresaForm";

export default async function ConfiguracionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: empresaId } = await params;

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresa) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Datos de la empresa</h2>
        <div className="mt-3">
          <EditEmpresaForm empresaId={empresaId} nombre={empresa.nombre} rut={empresa.rut} />
        </div>
      </div>
    </div>
  );
}
