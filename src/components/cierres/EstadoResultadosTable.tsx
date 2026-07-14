import { formatearMonto, NOMBRES_MESES } from "@/lib/format";
import type { EstadoResultados, SeccionResultados, Subtotal } from "@/lib/reportes";

function FilaSeccion({ seccion }: { seccion: SeccionResultados }) {
  if (seccion.lineas.length === 0) return null;
  return (
    <>
      <tr className="bg-neutral-50">
        <td className="px-4 py-2 font-semibold text-neutral-900">{seccion.label}</td>
        {seccion.montosPorMes.map((m, i) => (
          <td key={i} className="px-4 py-2 text-right tabular-nums font-semibold text-neutral-900">
            {formatearMonto(m)}
          </td>
        ))}
        <td className="px-4 py-2 text-right tabular-nums font-semibold text-neutral-900">
          {formatearMonto(seccion.total)}
        </td>
      </tr>
      {seccion.lineas.map((linea) => (
        <tr key={linea.cuentaId}>
          <td className="px-4 py-2 pl-8 text-neutral-700">{linea.nombre}</td>
          {linea.montosPorMes.map((m, i) => (
            <td key={i} className="px-4 py-2 text-right tabular-nums text-neutral-600">
              {formatearMonto(m)}
            </td>
          ))}
          <td className="px-4 py-2 text-right tabular-nums text-neutral-600">{formatearMonto(linea.total)}</td>
        </tr>
      ))}
    </>
  );
}

function FilaSubtotal({ subtotal, enfasis = false }: { subtotal: Subtotal; enfasis?: boolean }) {
  return (
    <tr className={enfasis ? "border-y-2 border-neutral-900 bg-neutral-100" : "border-y border-neutral-300"}>
      <td className="px-4 py-2 font-bold text-neutral-900">{subtotal.label}</td>
      {subtotal.montosPorMes.map((m, i) => (
        <td key={i} className="px-4 py-2 text-right tabular-nums font-bold text-neutral-900">
          {formatearMonto(m)}
        </td>
      ))}
      <td className="px-4 py-2 text-right tabular-nums font-bold text-neutral-900">
        {formatearMonto(subtotal.total)}
      </td>
    </tr>
  );
}

export function EstadoResultadosTable({ estado }: { estado: EstadoResultados }) {
  const [ingresos, costoVentas, gastosAdmin, costosFinancieros, otrasGanancias, impuesto] = estado.secciones;

  if (estado.meses.length === 0) {
    return (
      <p className="mt-4 text-sm text-neutral-500">
        Ninguna cuenta de este cierre está clasificada como cuenta de resultado todavía. Ve a &quot;Plan de
        cuentas&quot; y asigna una sección a las cuentas de ingresos y gastos.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-neutral-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-2">Estado de Resultados</th>
            {estado.meses.map((mes) => (
              <th key={mes} className="px-4 py-2 text-right">
                {NOMBRES_MESES[mes - 1]}
              </th>
            ))}
            <th className="px-4 py-2 text-right">Acumulado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          <FilaSeccion seccion={ingresos} />
          <FilaSeccion seccion={costoVentas} />
          <FilaSubtotal subtotal={estado.margenBruto} />
          <FilaSeccion seccion={gastosAdmin} />
          <FilaSubtotal subtotal={estado.ebitda} />
          <FilaSeccion seccion={costosFinancieros} />
          <FilaSeccion seccion={otrasGanancias} />
          <FilaSeccion seccion={impuesto} />
          <FilaSubtotal subtotal={estado.resultadoAntesImpuestos} enfasis />
        </tbody>
      </table>
    </div>
  );
}
