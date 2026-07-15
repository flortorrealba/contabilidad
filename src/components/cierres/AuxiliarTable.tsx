import { formatearFecha, formatearMonto } from "@/lib/format";
import type { AuxiliarCuenta } from "@/lib/reportes";

export function AuxiliarTable({ auxiliar }: { auxiliar: AuxiliarCuenta }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Cliente / Proveedor / Persona</th>
              <th className="px-3 py-2 text-right">Debe</th>
              <th className="px-3 py-2 text-right">Haber</th>
              <th className="px-3 py-2 text-right">Saldo deudor</th>
              <th className="px-3 py-2 text-right">Saldo acreedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {auxiliar.entidades.map((e) => (
              <tr key={e.entidad}>
                <td className="px-3 py-1.5 font-medium text-neutral-900">{e.entidad}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">{formatearMonto(e.totalDebe)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">{formatearMonto(e.totalHaber)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                  {e.saldoFinalDeudor ? formatearMonto(e.saldoFinalDeudor) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                  {e.saldoFinalAcreedor ? formatearMonto(e.saldoFinalAcreedor) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-neutral-300 font-semibold text-neutral-900">
            <tr>
              <td className="px-3 py-2">Totales</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatearMonto(auxiliar.totalDebe)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatearMonto(auxiliar.totalHaber)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatearMonto(auxiliar.saldoFinalDeudor)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatearMonto(auxiliar.saldoFinalAcreedor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="space-y-2">
        {auxiliar.entidades.map((e) => (
          <div key={e.entidad} className="rounded-md border border-neutral-200 bg-white">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-neutral-900">{e.entidad}</span>
              <span className="text-sm tabular-nums text-neutral-700">
                {e.saldoFinalDeudor ? formatearMonto(e.saldoFinalDeudor) : ""}
                {e.saldoFinalAcreedor ? formatearMonto(e.saldoFinalAcreedor) : ""}
                {!e.saldoFinalDeudor && !e.saldoFinalAcreedor ? "—" : ""}
              </span>
            </div>

            {e.facturasPendientes.length > 0 ? (
              <div className="overflow-x-auto border-t border-neutral-100">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Docto.</th>
                      <th className="px-3 py-2">Glosa</th>
                      <th className="px-3 py-2 text-right">Monto original</th>
                      <th className="px-3 py-2 text-right">Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {e.facturasPendientes.map((f, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap px-3 py-1.5 text-neutral-500">{formatearFecha(f.fecha)}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-neutral-500">{f.numeroDocto ?? "—"}</td>
                        <td className="px-3 py-1.5 text-neutral-700">{f.glosa ?? "—"}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-neutral-500">
                          {formatearMonto(f.montoOriginal)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium text-neutral-900">
                          {formatearMonto(f.montoPendiente)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="border-t border-neutral-100 px-3 py-2 text-sm text-neutral-500">
                Sin facturas pendientes — todos los documentos están aplicados.
              </p>
            )}

            <details className="border-t border-neutral-100">
              <summary className="cursor-pointer px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50">
                Ver todos los movimientos ({e.movimientos.length})
              </summary>
              <div className="overflow-x-auto border-t border-neutral-100">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Docto.</th>
                      <th className="px-3 py-2">Glosa</th>
                      <th className="px-3 py-2 text-right">Debe</th>
                      <th className="px-3 py-2 text-right">Haber</th>
                      <th className="px-3 py-2 text-right">Saldo deudor</th>
                      <th className="px-3 py-2 text-right">Saldo acreedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {e.movimientos.map((m) => (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap px-3 py-1.5 text-neutral-500">{formatearFecha(m.fecha)}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-neutral-500">{m.numeroDocto ?? "—"}</td>
                        <td className="px-3 py-1.5 text-neutral-700">{m.glosa ?? "—"}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                          {m.debe ? formatearMonto(m.debe) : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                          {m.haber ? formatearMonto(m.haber) : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                          {m.saldoDeudor ? formatearMonto(m.saldoDeudor) : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                          {m.saldoAcreedor ? formatearMonto(m.saldoAcreedor) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
