import Link from "next/link";
import { formatearMonto } from "@/lib/format";
import type { CategoriaEFF, EstadoSituacionFinanciera, GrupoEFF } from "@/lib/reportes";

function FilaCategoria({
  categoria,
  empresaId,
  cierreId,
}: {
  categoria: CategoriaEFF;
  empresaId: string;
  cierreId: string;
}) {
  return (
    <div key={categoria.categoria}>
      <div className="flex justify-between bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-neutral-900">
        <span>{categoria.label}</span>
        <span className="tabular-nums">{formatearMonto(categoria.total)}</span>
      </div>
      {categoria.lineas.map((linea) => (
        <div key={linea.cuentaId} className="flex justify-between px-3 py-1 pl-6 text-sm text-neutral-600">
          <Link
            href={`/empresas/${empresaId}/cierres/${cierreId}/mayor/${linea.cuentaId}`}
            className="hover:underline"
          >
            {linea.nombre}
          </Link>
          <span className="tabular-nums">{formatearMonto(linea.monto)}</span>
        </div>
      ))}
    </div>
  );
}

function Grupo({ grupo, empresaId, cierreId }: { grupo: GrupoEFF; empresaId: string; cierreId: string }) {
  if (grupo.categorias.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex justify-between border-b border-neutral-300 px-3 py-1.5 text-sm font-bold text-neutral-900">
        <span>{grupo.label}</span>
        <span className="tabular-nums">{formatearMonto(grupo.total)}</span>
      </div>
      {grupo.categorias.map((c) => (
        <FilaCategoria key={c.categoria} categoria={c} empresaId={empresaId} cierreId={cierreId} />
      ))}
    </div>
  );
}

export function EstadoSituacionFinancieraTable({
  eff,
  empresaId,
  cierreId,
}: {
  eff: EstadoSituacionFinanciera;
  empresaId: string;
  cierreId: string;
}) {
  const tieneDatos =
    eff.activoCorriente.categorias.length > 0 ||
    eff.activoNoCorriente.categorias.length > 0 ||
    eff.pasivoCorriente.categorias.length > 0 ||
    eff.pasivoNoCorriente.categorias.length > 0 ||
    eff.patrimonio.categorias.length > 0;

  if (!tieneDatos) {
    return (
      <p className="mt-4 text-sm text-neutral-500">
        Ninguna cuenta de este cierre está clasificada como cuenta de balance todavía. Ve a &quot;Plan de
        cuentas&quot; y asigna una categoría a las cuentas de activos, pasivos y patrimonio.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div
        className={
          "rounded-md border p-4 text-sm " +
          (eff.cuadra
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800")
        }
      >
        {eff.cuadra ? (
          <p>✅ El balance cuadra: Total Activos = Total Patrimonio y Pasivos.</p>
        ) : (
          <p>
            ⚠️ El balance NO cuadra. Diferencia de {formatearMonto(Math.abs(eff.diferencia))} entre Activos
            y Patrimonio + Pasivos. Revisa si hay cuentas &quot;Sin clasificar&quot; en el Plan de cuentas.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
          <div className="bg-neutral-900 px-3 py-2 text-sm font-bold text-white">ACTIVOS</div>
          <Grupo grupo={eff.activoCorriente} empresaId={empresaId} cierreId={cierreId} />
          <Grupo grupo={eff.activoNoCorriente} empresaId={empresaId} cierreId={cierreId} />
          <div className="flex justify-between border-t-2 border-neutral-900 px-3 py-2 text-sm font-bold text-neutral-900">
            <span>TOTAL ACTIVOS</span>
            <span className="tabular-nums">{formatearMonto(eff.totalActivos)}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
          <div className="bg-neutral-900 px-3 py-2 text-sm font-bold text-white">PATRIMONIO Y PASIVOS</div>
          <Grupo grupo={eff.pasivoCorriente} empresaId={empresaId} cierreId={cierreId} />
          <Grupo grupo={eff.pasivoNoCorriente} empresaId={empresaId} cierreId={cierreId} />
          <Grupo grupo={eff.patrimonio} empresaId={empresaId} cierreId={cierreId} />
          <div className="flex justify-between border-t-2 border-neutral-900 px-3 py-2 text-sm font-bold text-neutral-900">
            <span>TOTAL PATRIMONIO Y PASIVOS</span>
            <span className="tabular-nums">{formatearMonto(eff.totalPatrimonioYPasivos)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
