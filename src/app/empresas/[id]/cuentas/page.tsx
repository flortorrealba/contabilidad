import { prisma } from "@/lib/prisma";
import { CuentaCategoriaSelect } from "@/components/cuentas/CuentaCategoriaSelect";
import { ReclasificarButton } from "@/components/cuentas/ReclasificarButton";

export default async function CuentasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: empresaId } = await params;

  const cuentas = await prisma.cuenta.findMany({
    where: { empresaId },
    orderBy: [{ nombre: "asc" }],
  });

  const sinClasificar = cuentas.filter((c) => c.categoria === "SIN_CLASIFICAR");

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600">
        Clasifica cada cuenta para que el Estado de Resultados y el Estado de Situación Financiera
        (Balance) la agrupen correctamente. Las cuentas &quot;Sin clasificar&quot; no aparecen en
        ninguno de los dos reportes.
      </p>

      {sinClasificar.length > 0 && <ReclasificarButton empresaId={empresaId} />}

      {cuentas.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aún no hay cuentas. Se crean automáticamente al subir un libro diario.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Cuenta</th>
                <th className="px-4 py-2">Categoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {cuentas.map((cuenta) => (
                <tr key={cuenta.id}>
                  <td className="px-4 py-2 text-neutral-500">{cuenta.codigo ?? "—"}</td>
                  <td className="px-4 py-2 font-medium text-neutral-900">{cuenta.nombre}</td>
                  <td className="px-4 py-2">
                    <CuentaCategoriaSelect empresaId={empresaId} cuentaId={cuenta.id} categoria={cuenta.categoria} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sinClasificar.length > 0 && (
        <p className="text-xs text-amber-600">
          {sinClasificar.length} cuenta(s) quedaron &quot;Sin clasificar&quot; porque no se reconoció su
          nombre. Clasifícalas para que aparezcan en el Estado de Resultados o el Balance.
        </p>
      )}
    </div>
  );
}
