import { prisma } from "./prisma";
import { SECCIONES_PL, SECCION_PL_LABEL, type SeccionPL } from "./pl-secciones";

export interface FilaBalance {
  cuentaId: string;
  codigo: string | null;
  nombre: string;
  seccionPL: string;
  debe: number;
  haber: number;
  saldoDeudor: number;
  saldoAcreedor: number;
}

export interface BalanceComprobacion {
  filas: FilaBalance[];
  totalDebe: number;
  totalHaber: number;
  totalSaldoDeudor: number;
  totalSaldoAcreedor: number;
  cuadra: boolean;
}

const TOLERANCIA = 1; // pesos, para absorber redondeos

export async function obtenerBalanceComprobacion(cierreId: string): Promise<BalanceComprobacion> {
  const agrupado = await prisma.asiento.groupBy({
    by: ["cuentaId"],
    where: { cierreId },
    _sum: { debe: true, haber: true },
  });

  const cuentas = await prisma.cuenta.findMany({
    where: { id: { in: agrupado.map((g) => g.cuentaId) } },
  });
  const mapaCuentas = new Map(cuentas.map((c) => [c.id, c]));

  const filas: FilaBalance[] = agrupado.map((g) => {
    const cuenta = mapaCuentas.get(g.cuentaId)!;
    const debe = g._sum.debe ?? 0;
    const haber = g._sum.haber ?? 0;
    const diferencia = debe - haber;
    return {
      cuentaId: g.cuentaId,
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      seccionPL: cuenta.seccionPL,
      debe,
      haber,
      saldoDeudor: diferencia > 0 ? diferencia : 0,
      saldoAcreedor: diferencia < 0 ? -diferencia : 0,
    };
  });

  filas.sort((a, b) => (a.codigo ?? "").localeCompare(b.codigo ?? "") || a.nombre.localeCompare(b.nombre));

  const totalDebe = filas.reduce((s, f) => s + f.debe, 0);
  const totalHaber = filas.reduce((s, f) => s + f.haber, 0);
  const totalSaldoDeudor = filas.reduce((s, f) => s + f.saldoDeudor, 0);
  const totalSaldoAcreedor = filas.reduce((s, f) => s + f.saldoAcreedor, 0);

  return {
    filas,
    totalDebe,
    totalHaber,
    totalSaldoDeudor,
    totalSaldoAcreedor,
    cuadra: Math.abs(totalDebe - totalHaber) < TOLERANCIA,
  };
}

export interface LineaResultados {
  cuentaId: string;
  nombre: string;
  montosPorMes: number[];
  total: number;
}

export interface SeccionResultados {
  seccion: SeccionPL;
  label: string;
  lineas: LineaResultados[];
  montosPorMes: number[];
  total: number;
}

export interface Subtotal {
  label: string;
  montosPorMes: number[];
  total: number;
}

export interface EstadoResultados {
  meses: number[];
  secciones: SeccionResultados[];
  margenBruto: Subtotal;
  ebitda: Subtotal;
  resultadoAntesImpuestos: Subtotal;
}

function sumarVectores(a: number[], b: number[]) {
  return a.map((v, i) => v + b[i]);
}

export async function obtenerEstadoResultados(cierreId: string): Promise<EstadoResultados> {
  const agrupado = await prisma.asiento.groupBy({
    by: ["cuentaId", "mes"],
    where: { cierreId, cuenta: { seccionPL: { not: "NONE" } } },
    _sum: { debe: true, haber: true },
  });

  const mesesSet = new Set<number>(agrupado.map((g) => g.mes));
  const meses = Array.from(mesesSet).sort((a, b) => a - b);
  const mesIndice = new Map(meses.map((m, i) => [m, i]));

  const cuentaIds = Array.from(new Set(agrupado.map((g) => g.cuentaId)));
  const cuentas = await prisma.cuenta.findMany({ where: { id: { in: cuentaIds } } });
  const mapaCuentas = new Map(cuentas.map((c) => [c.id, c]));

  const lineasPorCuenta = new Map<string, LineaResultados>();
  for (const g of agrupado) {
    const cuenta = mapaCuentas.get(g.cuentaId)!;
    let linea = lineasPorCuenta.get(g.cuentaId);
    if (!linea) {
      linea = { cuentaId: g.cuentaId, nombre: cuenta.nombre, montosPorMes: meses.map(() => 0), total: 0 };
      lineasPorCuenta.set(g.cuentaId, linea);
    }
    const monto = (g._sum.haber ?? 0) - (g._sum.debe ?? 0);
    const idx = mesIndice.get(g.mes)!;
    linea.montosPorMes[idx] += monto;
    linea.total += monto;
  }

  const seccionesMap = new Map<SeccionPL, SeccionResultados>();
  for (const seccion of SECCIONES_PL) {
    seccionesMap.set(seccion, {
      seccion,
      label: SECCION_PL_LABEL[seccion],
      lineas: [],
      montosPorMes: meses.map(() => 0),
      total: 0,
    });
  }

  for (const g of agrupado) {
    const cuenta = mapaCuentas.get(g.cuentaId)!;
    const seccion = seccionesMap.get(cuenta.seccionPL as SeccionPL);
    if (!seccion) continue;
    const linea = lineasPorCuenta.get(g.cuentaId)!;
    if (!seccion.lineas.some((l) => l.cuentaId === linea.cuentaId)) {
      seccion.lineas.push(linea);
    }
  }

  for (const seccion of seccionesMap.values()) {
    seccion.lineas.sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
    for (const linea of seccion.lineas) {
      seccion.montosPorMes = sumarVectores(seccion.montosPorMes, linea.montosPorMes);
      seccion.total += linea.total;
    }
  }

  const secciones = SECCIONES_PL.map((s) => seccionesMap.get(s)!);

  const ingresos = seccionesMap.get("INGRESOS")!;
  const costoVentas = seccionesMap.get("COSTO_VENTAS")!;
  const gastosAdmin = seccionesMap.get("GASTOS_ADMIN_VENTAS")!;
  const costosFinancieros = seccionesMap.get("COSTOS_FINANCIEROS")!;
  const otrasGanancias = seccionesMap.get("OTRAS_GANANCIAS_PERDIDAS")!;
  const impuesto = seccionesMap.get("IMPUESTO_GANANCIAS")!;

  const margenBrutoMontos = sumarVectores(ingresos.montosPorMes, costoVentas.montosPorMes);
  const margenBruto: Subtotal = {
    label: "MARGEN BRUTO",
    montosPorMes: margenBrutoMontos,
    total: ingresos.total + costoVentas.total,
  };

  const ebitdaMontos = sumarVectores(margenBrutoMontos, gastosAdmin.montosPorMes);
  const ebitda: Subtotal = {
    label: "EBITDA",
    montosPorMes: ebitdaMontos,
    total: margenBruto.total + gastosAdmin.total,
  };

  const resultadoMontos = sumarVectores(
    sumarVectores(ebitdaMontos, costosFinancieros.montosPorMes),
    sumarVectores(otrasGanancias.montosPorMes, impuesto.montosPorMes)
  );
  const resultadoAntesImpuestos: Subtotal = {
    label: "RESULTADO ANTES DE IMPUESTOS",
    montosPorMes: resultadoMontos,
    total: ebitda.total + costosFinancieros.total + otrasGanancias.total + impuesto.total,
  };

  return { meses, secciones, margenBruto, ebitda, resultadoAntesImpuestos };
}
