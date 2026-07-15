import { formatearFecha, formatearMonto } from "@/lib/format";
import type { MayorCuenta } from "@/lib/reportes";

export function MayorTable({ mayor }: { mayor: MayorCuenta }) {
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
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
          {mayor.movimientos.map((m) => (
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
        <tfoot className="border-t-2 border-neutral-300 font-semibold text-neutral-900">
          <tr>
            <td className="px-3 py-2" colSpan={3}>
              Totales
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{formatearMonto(mayor.totalDebe)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatearMonto(mayor.totalHaber)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatearMonto(mayor.saldoFinalDeudor)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatearMonto(mayor.saldoFinalAcreedor)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
