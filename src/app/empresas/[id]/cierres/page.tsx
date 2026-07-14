import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearFecha, formatearMonto } from "@/lib/format";
import { UploadCierreForm } from "@/components/cierres/UploadCierreForm";

export default async function CierresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: empresaId } = await params;

  const cierres = await prisma.cierre.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { asientos: true } }, creadoPor: true },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Subir libro diario</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Cada archivo que subas crea un nuevo cierre guardado con su propio Balance de Comprobación y
          Estado de Resultados.
        </p>
        <div className="mt-4">
          <UploadCierreForm empresaId={empresaId} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Cierres guardados</h2>
        {cierres.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Todavía no has subido ningún libro diario.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
            {cierres.map((cierre) => (
              <li key={cierre.id}>
                <Link
                  href={`/empresas/${empresaId}/cierres/${cierre.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{cierre.nombre}</p>
                    <p className="text-xs text-neutral-500">
                      {formatearFecha(cierre.fechaDesde)} – {formatearFecha(cierre.fechaHasta)} ·{" "}
                      {cierre._count.asientos.toLocaleString("es-CL")} asientos · Debe{" "}
                      {formatearMonto(cierre.totalDebe)} · Haber {formatearMonto(cierre.totalHaber)}
                    </p>
                  </div>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-xs font-medium " +
                      (cierre.cuadra ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")
                    }
                  >
                    {cierre.cuadra ? "Cuadrado" : "No cuadra"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
