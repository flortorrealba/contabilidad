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
          <details key={e.entidad} className="rounded-md border border-neutral-200 bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50">
              {e.entidad} — {e.movimientos.length} movimiento{e.movimientos.length === 1 ? "" : "s"}
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
        ))}
      </div>
    </div>
  );
}
