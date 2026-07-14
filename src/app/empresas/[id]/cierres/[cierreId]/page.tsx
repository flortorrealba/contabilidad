import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerBalanceComprobacion, obtenerEstadoResultados } from "@/lib/reportes";
import { formatearFecha } from "@/lib/format";
import { ReportTabs } from "@/components/cierres/ReportTabs";
import { BalanceTable } from "@/components/cierres/BalanceTable";
import { EstadoResultadosTable } from "@/components/cierres/EstadoResultadosTable";
import { DeleteCierreButton } from "@/components/cierres/DeleteCierreButton";

export default async function CierreDetallePage({
  params,
}: {
  params: Promise<{ id: string; cierreId: string }>;
}) {
  const { id: empresaId, cierreId } = await params;

  const cierre = await prisma.cierre.findUnique({ where: { id: cierreId } });
  if (!cierre || cierre.empresaId !== empresaId) notFound();

  const [balance, estadoResultados] = await Promise.all([
    obtenerBalanceComprobacion(cierreId),
    obtenerEstadoResultados(cierreId),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{cierre.nombre}</h2>
          <p className="text-sm text-neutral-500">
            {formatearFecha(cierre.fechaDesde)} – {formatearFecha(cierre.fechaHasta)}
            {cierre.archivoOrigen ? ` · ${cierre.archivoOrigen}` : ""}
          </p>
        </div>
        <DeleteCierreButton empresaId={empresaId} cierreId={cierreId} />
      </div>

      <ReportTabs
        resultados={<EstadoResultadosTable estado={estadoResultados} />}
        balance={<BalanceTable balance={balance} />}
      />
    </div>
  );
}
