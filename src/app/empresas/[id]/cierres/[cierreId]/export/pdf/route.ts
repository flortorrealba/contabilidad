import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEmpresaAccess, AuthError } from "@/lib/auth";
import { obtenerBalanceComprobacion, obtenerEstadoResultados } from "@/lib/reportes";
import { generarPdfCierre } from "@/lib/export/pdf";
import { nombreArchivo } from "@/lib/export/excel";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; cierreId: string }> }
) {
  const { id: empresaId, cierreId } = await params;

  try {
    const user = await requireUser();
    await requireEmpresaAccess(user.id, empresaId);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const cierre = await prisma.cierre.findUnique({ where: { id: cierreId }, include: { empresa: true } });
  if (!cierre || cierre.empresaId !== empresaId) notFound();

  const [balance, estado] = await Promise.all([
    obtenerBalanceComprobacion(cierreId),
    obtenerEstadoResultados(cierreId),
  ]);

  const buffer = await generarPdfCierre(cierre.empresa.nombre, cierre.nombre, balance, estado);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombreArchivo(cierre.nombre, "pdf")}"`,
    },
  });
}
