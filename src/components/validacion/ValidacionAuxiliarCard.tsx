import { formatearFecha, formatearMonto } from "@/lib/format";
import type { ValidacionAuxiliar } from "@/lib/reportes";

export function ValidacionAuxiliarCard({ validacion }: { validacion: ValidacionAuxiliar }) {
  const sinDiferencias = validacion.diferencias.length === 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Comparado contra {validacion.archivoOrigen ?? "el archivo subido"} · {formatearFecha(validacion.fecha)} ·{" "}
        {validacion.totalDocumentosArchivo} documentos pendientes en el archivo de iContador.
      </p>

      <div
        className={
          "rounded-md border p-4 text-sm " +
          (sinDiferencias ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800")
        }
      >
        {sinDiferencias ? (
          <p>✅ Las facturas pendientes calculadas desde el libro diario coinciden con las de iContador.</p>
        ) : (
          <p>
            ⚠️ Se encontraron {validacion.diferencias.length} documento
            {validacion.diferencias.length === 1 ? "" : "s"} con diferencias entre el sistema e iContador.
          </p>
        )}
      </div>

      {validacion.diferencias.length > 0 && (
        <p className="text-xs text-neutral-500">
          Si un documento dice &quot;no aparece&quot; del lado de iContador, generalmente significa que ya se
          pagó <em>después</em> del cierre (el reporte de iContador refleja el estado a la fecha en que lo
          descargaste, no al último día del período de este cierre) — no necesariamente un error. Revisa con
          más atención los casos donde ambos lados muestran un saldo pero con montos distintos.
        </p>
      )}

      {validacion.diferencias.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Cliente / Proveedor / Persona</th>
                <th className="px-3 py-2">Docto.</th>
                <th className="px-3 py-2 text-right">Saldo (sistema)</th>
                <th className="px-3 py-2 text-right">Saldo (iContador)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {validacion.diferencias.map((d, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 font-medium text-neutral-900">{d.entidad}</td>
                  <td className="px-3 py-1.5 text-neutral-500">{d.numero}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-neutral-700">
                    {d.saldoInterno === null ? "— (no aparece)" : formatearMonto(d.saldoInterno)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-red-700">
                    {d.saldoExterno === null ? "— (no aparece)" : formatearMonto(d.saldoExterno)}
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
