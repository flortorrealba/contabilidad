import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerAuxiliarCuenta, obtenerMayorCuenta, obtenerValidacionAuxiliar } from "@/lib/reportes";
import { MayorTable } from "@/components/cierres/MayorTable";
import { AuxiliarTable } from "@/components/cierres/AuxiliarTable";
import { MayorAuxiliarTabs } from "@/components/cierres/MayorAuxiliarTabs";
import { UploadValidacionAuxiliarForm } from "@/components/validacion/UploadValidacionAuxiliarForm";
import { ValidacionAuxiliarCard } from "@/components/validacion/ValidacionAuxiliarCard";

export default async function MayorCuentaPage({
  params,
}: {
  params: Promise<{ id: string; cierreId: string; cuentaId: string }>;
}) {
  const { id: empresaId, cierreId, cuentaId } = await params;

  const cierre = await prisma.cierre.findUnique({ where: { id: cierreId } });
  if (!cierre || cierre.empresaId !== empresaId) notFound();

  const mayor = await obtenerMayorCuenta(cierreId, cuentaId);
  if (!mayor) notFound();

  const [auxiliar, validacionAuxiliar] = await Promise.all([
    mayor.tieneAuxiliar ? obtenerAuxiliarCuenta(cierreId, cuentaId) : Promise.resolve(null),
    mayor.tieneAuxiliar ? obtenerValidacionAuxiliar(cierreId, cuentaId) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/empresas/${empresaId}/cierres/${cierreId}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Volver al cierre
        </Link>
        <h2 className="mt-1 text-lg font-semibold text-neutral-900">
          {mayor.cuenta.codigo ? `${mayor.cuenta.codigo} · ` : ""}
          {mayor.cuenta.nombre}
        </h2>
        <p className="text-sm text-neutral-500">{cierre.nombre}</p>
      </div>

      <MayorAuxiliarTabs
        mayor={<MayorTable mayor={mayor} />}
        auxiliar={auxiliar ? <AuxiliarTable auxiliar={auxiliar} /> : null}
        validacion={
          mayor.tieneAuxiliar ? (
            <div className="space-y-4">
              <UploadValidacionAuxiliarForm empresaId={empresaId} cierreId={cierreId} />
              {validacionAuxiliar ? (
                <ValidacionAuxiliarCard validacion={validacionAuxiliar} />
              ) : (
                <p className="text-sm text-neutral-500">
                  Aún no has subido el reporte de iContador para esta cuenta.
                </p>
              )}
            </div>
          ) : null
        }
      />
    </div>
  );
}
