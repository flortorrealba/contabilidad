import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerAuxiliarCuenta, obtenerMayorCuenta } from "@/lib/reportes";
import { MayorTable } from "@/components/cierres/MayorTable";
import { AuxiliarTable } from "@/components/cierres/AuxiliarTable";
import { MayorAuxiliarTabs } from "@/components/cierres/MayorAuxiliarTabs";

export default async function MayorCuentaPage({
  params,
}: {
  params: Promise<{ id: string; cierreId: string; cuentaId: string }>;
}) {
  const { id: empresaId, cierreId, cuentaId } = await params;

  const cierre = await prisma.cierre.findUnique({ where: { id: cierreId } });
  if (!cierre || cierre.empresaId !== empresaId) notFound();

  const mayor = await obtenerMayorCuenta(cierreId, cuentaId);
  if (!mayor) notFound();

  const auxiliar = mayor.tieneAuxiliar ? await obtenerAuxiliarCuenta(cierreId, cuentaId) : null;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/empresas/${empresaId}/cierres/${cierreId}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Volver al cierre
        </Link>
        <h2 className="mt-1 text-lg font-semibold text-neutral-900">
          {mayor.cuenta.codigo ? `${mayor.cuenta.codigo} · ` : ""}
          {mayor.cuenta.nombre}
        </h2>
        <p className="text-sm text-neutral-500">{cierre.nombre}</p>
      </div>

      <MayorAuxiliarTabs
        mayor={<MayorTable mayor={mayor} />}
        auxiliar={auxiliar ? <AuxiliarTable auxiliar={auxiliar} /> : null}
      />
    </div>
  );
}
