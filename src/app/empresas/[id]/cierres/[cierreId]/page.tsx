import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerBalanceComprobacion, obtenerEstadoResultados, obtenerEstadoSituacionFinanciera } from "@/lib/reportes";
import { formatearFecha } from "@/lib/format";
import { ReportTabs } from "@/components/cierres/ReportTabs";
import { BalanceTable } from "@/components/cierres/BalanceTable";
import { EstadoResultadosTable } from "@/components/cierres/EstadoResultadosTable";
import { EstadoSituacionFinancieraTable } from "@/components/cierres/EstadoSituacionFinancieraTable";
import { DeleteCierreButton } from "@/components/cierres/DeleteCierreButton";

export default async function CierreDetallePage({
  params,
}: {
  params: Promise<{ id: string; cierreId: string }>;
}) {
  const { id: empresaId, cierreId } = await params;

  const cierre = await prisma.cierre.findUnique({ where: { id: cierreId } });
  if (!cierre || cierre.empresaId !== empresaId) notFound();

  const [balance, estadoResultados, eff] = await Promise.all([
    obtenerBalanceComprobacion(cierreId),
    obtenerEstadoResultados(cierreId),
    obtenerEstadoSituacionFinanciera(cierreId),
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
        <div className="flex items-center gap-4">
          <a
            href={`/empresas/${empresaId}/cierres/${cierreId}/export/excel`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Descargar Excel
          </a>
          <a
            href={`/empresas/${empresaId}/cierres/${cierreId}/export/pdf`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Descargar PDF
          </a>
          <DeleteCierreButton empresaId={empresaId} cierreId={cierreId} />
        </div>
      </div>

      <ReportTabs
        resultados={<EstadoResultadosTable estado={estadoResultados} />}
        eff={<EstadoSituacionFinancieraTable eff={eff} />}
        balance={<BalanceTable balance={balance} />}
      />
    </div>
  );
}
