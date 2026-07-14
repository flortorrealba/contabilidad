import { prisma } from "@/lib/prisma";
import { CuentaSeccionSelect } from "@/components/cuentas/CuentaSeccionSelect";

export default async function CuentasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: empresaId } = await params;

  const cuentas = await prisma.cuenta.findMany({
    where: { empresaId },
    orderBy: [{ nombre: "asc" }],
  });

  const sinClasificar = cuentas.filter((c) => c.seccionPL === "NONE" && !esCuentaDeBalanceProbable(c.nombre));

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600">
        Clasifica cada cuenta para que el Estado de Resultados la agrupe correctamente. Las cuentas de
        balance (activos, pasivos, patrimonio) deben quedar como &quot;Cuenta de balance&quot;: no se
        muestran en el Estado de Resultados.
      </p>

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
                <th className="px-4 py-2">Sección en Estado de Resultados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {cuentas.map((cuenta) => (
                <tr key={cuenta.id}>
                  <td className="px-4 py-2 text-neutral-500">{cuenta.codigo ?? "—"}</td>
                  <td className="px-4 py-2 font-medium text-neutral-900">{cuenta.nombre}</td>
                  <td className="px-4 py-2">
                    <CuentaSeccionSelect empresaId={empresaId} cuentaId={cuenta.id} seccionPL={cuenta.seccionPL} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sinClasificar.length > 0 && (
        <p className="text-xs text-amber-600">
          {sinClasificar.length} cuenta(s) quedaron marcadas como &quot;Cuenta de balance&quot; por defecto
          porque no se reconoció su nombre. Revisa si alguna corresponde a ingresos o gastos.
        </p>
      )}
    </div>
  );
}

// Heurística simple solo para la advertencia en pantalla, no afecta el cálculo del reporte.
function esCuentaDeBalanceProbable(nombre: string) {
  const palabrasBalance = ["CAJA", "BANCO", "CLIENTE", "PROVEEDOR", "IVA", "CAPITAL", "PATRIMONIO", "ACTIVO", "PASIVO", "ANTICIPO", "GARANTIA", "REMUNERACION", "IMPOSICION", "IMPUESTO POR PAGAR", "PRESTAMO", "CREDITO FISCAL"];
  const upper = nombre.toUpperCase();
  return palabrasBalance.some((p) => upper.includes(p));
}
