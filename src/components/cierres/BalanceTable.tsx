import { formatearMonto } from "@/lib/format";
import type { BalanceComprobacion } from "@/lib/reportes";

export function BalanceTable({ balance }: { balance: BalanceComprobacion }) {
  return (
    <div className="mt-4 space-y-4">
      <div
        className={
          "rounded-md border p-4 text-sm " +
          (balance.cuadra
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800")
        }
      >
        {balance.cuadra ? (
          <p>✅ La contabilidad cuadra: el total Debe es igual al total Haber.</p>
        ) : (
          <p>
            ⚠️ La contabilidad NO cuadra. Diferencia de{" "}
            {formatearMonto(Math.abs(balance.totalDebe - balance.totalHaber))} entre Debe y Haber.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Cuenta</th>
              <th className="px-4 py-2 text-right">Debe</th>
              <th className="px-4 py-2 text-right">Haber</th>
              <th className="px-4 py-2 text-right">Saldo deudor</th>
              <th className="px-4 py-2 text-right">Saldo acreedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {balance.filas.map((fila) => (
              <tr key={fila.cuentaId}>
                <td className="px-4 py-2 text-neutral-500">{fila.codigo ?? "—"}</td>
                <td className="px-4 py-2 font-medium text-neutral-900">{fila.nombre}</td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-700">{formatearMonto(fila.debe)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-700">{formatearMonto(fila.haber)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-700">
                  {fila.saldoDeudor ? formatearMonto(fila.saldoDeudor) : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-700">
                  {fila.saldoAcreedor ? formatearMonto(fila.saldoAcreedor) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-neutral-300 font-semibold text-neutral-900">
            <tr>
              <td className="px-4 py-2" colSpan={2}>
                Totales
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{formatearMonto(balance.totalDebe)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatearMonto(balance.totalHaber)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatearMonto(balance.totalSaldoDeudor)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatearMonto(balance.totalSaldoAcreedor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
