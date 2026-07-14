import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEmpresaAccess, AuthError } from "@/lib/auth";
import { obtenerBalanceComprobacion, obtenerEstadoResultados, obtenerEstadoSituacionFinanciera } from "@/lib/reportes";
import { generarExcelCierre, nombreArchivo } from "@/lib/export/excel";

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

  const cierre = await prisma.cierre.findUnique({ where: { id: cierreId } });
  if (!cierre || cierre.empresaId !== empresaId) notFound();

  const [balance, estado, eff] = await Promise.all([
    obtenerBalanceComprobacion(cierreId),
    obtenerEstadoResultados(cierreId),
    obtenerEstadoSituacionFinanciera(cierreId),
  ]);

  const buffer = generarExcelCierre(cierre.nombre, balance, estado, eff);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo(cierre.nombre, "xlsx")}"`,
    },
  });
}
