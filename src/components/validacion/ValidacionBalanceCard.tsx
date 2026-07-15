import { formatearFecha, formatearMonto } from "@/lib/format";
import type { ValidacionBalance } from "@/lib/reportes";

export function ValidacionBalanceCard({ validacion }: { validacion: ValidacionBalance }) {
  const sinDiferencias = validacion.diferencias.length === 0 && validacion.cuentasSoloEnIcontador.length === 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Comparado contra {validacion.archivoOrigen ?? "el archivo subido"} · {formatearFecha(validacion.fecha)} ·{" "}
        {validacion.totalCuentasComparadas} de {validacion.totalCuentasArchivo} cuentas del archivo encontradas
        en este cierre.
      </p>

      <div
        className={
          "rounded-md border p-4 text-sm " +
          (sinDiferencias ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800")
        }
      >
        {sinDiferencias ? (
          <p>✅ El Balance calculado desde el libro diario coincide exactamente con el de iContador.</p>
        ) : (
          <p>
            ⚠️ Se encontraron {validacion.diferencias.length} cuenta
            {validacion.diferencias.length === 1 ? "" : "s"} con diferencias
            {validacion.cuentasSoloEnIcontador.length > 0
              ? ` y ${validacion.cuentasSoloEnIcontador.length} cuenta${
                  validacion.cuentasSoloEnIcontador.length === 1 ? "" : "s"
                } que aparecen solo en iContador`
              : ""}
            .
          </p>
        )}
      </div>

      {validacion.diferencias.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Cuenta</th>
                <th className="px-3 py-2 text-right">Debe (sistema)</th>
                <th className="px-3 py-2 text-right">Debe (iContador)</th>
                <th className="px-3 py-2 text-right">Haber (sistema)</th>
                <th className="px-3 py-2 text-right">Haber (iContador)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {validacion.diferencias.map((d) => (
                <tr key={d.codigo}>
                  <td className="px-3 py-1.5 text-neutral-500">{d.codigo}</td>
                  <td className="px-3 py-1.5 font-medium text-neutral-900">{d.nombre}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                    {formatearMonto(d.debeInterno)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-red-700">
                    {formatearMonto(d.debeExterno)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                    {formatearMonto(d.haberInterno)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-red-700">
                    {formatearMonto(d.haberExterno)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {validacion.cuentasSoloEnIcontador.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
          <p className="border-b border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900">
            Cuentas del archivo de iContador que no aparecen en este cierre
          </p>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Cuenta</th>
                <th className="px-3 py-2 text-right">Débitos</th>
                <th className="px-3 py-2 text-right">Créditos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {validacion.cuentasSoloEnIcontador.map((c) => (
                <tr key={c.codigo}>
                  <td className="px-3 py-1.5 text-neutral-500">{c.codigo}</td>
                  <td className="px-3 py-1.5 font-medium text-neutral-900">{c.nombre}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                    {formatearMonto(c.debitos)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                    {formatearMonto(c.creditos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
