import { prisma } from "./prisma";
import {
  CATEGORIAS_BALANCE,
  CATEGORIAS_RESULTADO,
  CATEGORIA_META,
  GRUPO_LABEL,
  esGrupoActivo,
  type Categoria,
  type Grupo,
  type SeccionPL,
} from "./clasificacion";
import type { FilaBalanceExterno, AuxiliarExternoParseado } from "./icontador-parser";

export interface FilaBalance {
  cuentaId: string;
  codigo: string | null;
  nombre: string;
  categoria: string;
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
      categoria: cuenta.categoria,
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
    where: { cierreId, cuenta: { categoria: { in: [...CATEGORIAS_RESULTADO] } } },
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
  for (const seccion of CATEGORIAS_RESULTADO) {
    seccionesMap.set(seccion, {
      seccion,
      label: CATEGORIA_META[seccion].label,
      lineas: [],
      montosPorMes: meses.map(() => 0),
      total: 0,
    });
  }

  for (const g of agrupado) {
    const cuenta = mapaCuentas.get(g.cuentaId)!;
    const seccion = seccionesMap.get(cuenta.categoria as SeccionPL);
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

  const secciones = CATEGORIAS_RESULTADO.map((s) => seccionesMap.get(s)!);

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

export interface LineaEFF {
  cuentaId: string;
  nombre: string;
  monto: number;
}

export interface CategoriaEFF {
  categoria: string;
  label: string;
  lineas: LineaEFF[];
  total: number;
}

export interface GrupoEFF {
  grupo: Grupo;
  label: string;
  categorias: CategoriaEFF[];
  total: number;
}

export interface EstadoSituacionFinanciera {
  activoCorriente: GrupoEFF;
  activoNoCorriente: GrupoEFF;
  totalActivos: number;
  pasivoCorriente: GrupoEFF;
  pasivoNoCorriente: GrupoEFF;
  patrimonio: GrupoEFF;
  totalPatrimonioYPasivos: number;
  diferencia: number;
  cuadra: boolean;
}

export async function obtenerEstadoSituacionFinanciera(cierreId: string): Promise<EstadoSituacionFinanciera> {
  const [agrupado, estadoResultados] = await Promise.all([
    prisma.asiento.groupBy({
      by: ["cuentaId"],
      where: { cierreId, cuenta: { categoria: { in: [...CATEGORIAS_BALANCE] } } },
      _sum: { debe: true, haber: true },
    }),
    obtenerEstadoResultados(cierreId),
  ]);

  const cuentas = await prisma.cuenta.findMany({ where: { id: { in: agrupado.map((g) => g.cuentaId) } } });
  const mapaCuentas = new Map(cuentas.map((c) => [c.id, c]));

  const categoriasMap = new Map<Categoria, CategoriaEFF>();
  for (const categoria of CATEGORIAS_BALANCE) {
    categoriasMap.set(categoria, { categoria, label: CATEGORIA_META[categoria].label, lineas: [], total: 0 });
  }

  for (const g of agrupado) {
    const cuenta = mapaCuentas.get(g.cuentaId)!;
    const categoria = cuenta.categoria as Categoria;
    const meta = CATEGORIA_META[categoria];
    if (!meta || meta.grupo === "RESULTADO") continue;
    const debe = g._sum.debe ?? 0;
    const haber = g._sum.haber ?? 0;
    const monto = esGrupoActivo(meta.grupo) ? debe - haber : haber - debe;
    const cat = categoriasMap.get(categoria)!;
    cat.lineas.push({ cuentaId: g.cuentaId, nombre: cuenta.nombre, monto });
    cat.total += monto;
  }

  for (const cat of categoriasMap.values()) {
    cat.lineas.sort((a, b) => b.monto - a.monto || a.nombre.localeCompare(b.nombre));
  }

  function construirGrupo(grupo: Grupo, categoriasExtra: CategoriaEFF[] = []): GrupoEFF {
    const categorias = CATEGORIAS_BALANCE.filter((c) => CATEGORIA_META[c].grupo === grupo)
      .map((c) => categoriasMap.get(c)!)
      .filter((c) => c.lineas.length > 0)
      .concat(categoriasExtra);
    const total = categorias.reduce((s, c) => s + c.total, 0);
    return { grupo, label: GRUPO_LABEL[grupo], categorias, total };
  }

  const activoCorriente = construirGrupo("ACTIVO_CORRIENTE");
  const activoNoCorriente = construirGrupo("ACTIVO_NO_CORRIENTE");
  const totalActivos = activoCorriente.total + activoNoCorriente.total;

  const pasivoCorriente = construirGrupo("PASIVO_CORRIENTE");
  const pasivoNoCorriente = construirGrupo("PASIVO_NO_CORRIENTE");

  const resultadoEjercicio: CategoriaEFF = {
    categoria: "RESULTADO_EJERCICIO",
    label: "Resultado del ejercicio",
    lineas: [],
    total: estadoResultados.resultadoAntesImpuestos.total,
  };
  const patrimonio = construirGrupo("PATRIMONIO", [resultadoEjercicio]);
  const totalPatrimonioYPasivos = pasivoCorriente.total + pasivoNoCorriente.total + patrimonio.total;

  const diferencia = totalActivos - totalPatrimonioYPasivos;

  return {
    activoCorriente,
    activoNoCorriente,
    totalActivos,
    pasivoCorriente,
    pasivoNoCorriente,
    patrimonio,
    totalPatrimonioYPasivos,
    diferencia,
    cuadra: Math.abs(diferencia) < TOLERANCIA,
  };
}

export interface MovimientoMayor {
  id: string;
  fecha: Date;
  tipo: string | null;
  numeroVoucher: string | null;
  numeroDocto: string | null;
  codigoAnalisis: string | null;
  glosa: string | null;
  debe: number;
  haber: number;
  saldoDeudor: number;
  saldoAcreedor: number;
}

interface CuentaResumen {
  id: string;
  codigo: string | null;
  nombre: string;
  categoria: string;
}

export interface MayorCuenta {
  cuenta: CuentaResumen;
  movimientos: MovimientoMayor[];
  totalDebe: number;
  totalHaber: number;
  saldoFinalDeudor: number;
  saldoFinalAcreedor: number;
  tieneAuxiliar: boolean;
}

function construirMovimientos(
  asientos: { id: string; fecha: Date; tipo: string | null; numeroVoucher: string | null; numeroDocto: string | null; codigoAnalisis: string | null; glosa: string | null; debe: number; haber: number }[]
) {
  let saldo = 0;
  const movimientos: MovimientoMayor[] = asientos.map((a) => {
    saldo += a.debe - a.haber;
    return {
      id: a.id,
      fecha: a.fecha,
      tipo: a.tipo,
      numeroVoucher: a.numeroVoucher,
      numeroDocto: a.numeroDocto,
      codigoAnalisis: a.codigoAnalisis,
      glosa: a.glosa,
      debe: a.debe,
      haber: a.haber,
      saldoDeudor: saldo > 0 ? saldo : 0,
      saldoAcreedor: saldo < 0 ? -saldo : 0,
    };
  });
  const totalDebe = asientos.reduce((s, a) => s + a.debe, 0);
  const totalHaber = asientos.reduce((s, a) => s + a.haber, 0);
  return {
    movimientos,
    totalDebe,
    totalHaber,
    saldoFinalDeudor: saldo > 0 ? saldo : 0,
    saldoFinalAcreedor: saldo < 0 ? -saldo : 0,
  };
}

export async function obtenerMayorCuenta(cierreId: string, cuentaId: string): Promise<MayorCuenta | null> {
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
  if (!cuenta) return null;

  const asientos = await prisma.asiento.findMany({
    where: { cierreId, cuentaId },
    orderBy: [{ fecha: "asc" }, { numeroVoucher: "asc" }],
  });

  const { movimientos, totalDebe, totalHaber, saldoFinalDeudor, saldoFinalAcreedor } =
    construirMovimientos(asientos);

  return {
    cuenta: { id: cuenta.id, codigo: cuenta.codigo, nombre: cuenta.nombre, categoria: cuenta.categoria },
    movimientos,
    totalDebe,
    totalHaber,
    saldoFinalDeudor,
    saldoFinalAcreedor,
    tieneAuxiliar: asientos.some((a) => a.codigoAnalisis && a.codigoAnalisis.trim() !== ""),
  };
}

export interface AplicacionFactura {
  fecha: Date;
  numeroDocto: string | null;
  glosa: string | null;
  monto: number;
}

export interface FacturaPendiente {
  numeroDocto: string | null;
  fecha: Date;
  glosa: string | null;
  montoOriginal: number;
  montoPendiente: number;
  aplicaciones: AplicacionFactura[];
}

// Los pagos, notas de crédito y regularizaciones casi siempre repiten el mismo
// número de documento que la factura que están liquidando (ej: la factura
// "F/68402" se paga con un asiento "PAGO FAE: 68402" que también trae
// numeroDocto="68402"; una "NC/1878" se regulariza con un asiento que también
// trae numeroDocto="1878"). Por eso, para saber qué facturas siguen pendientes,
// se agrupan los movimientos por numeroDocto y se netea debe-haber dentro de
// cada grupo: lo que no cuadra a cero es el saldo pendiente de ese documento
// específico — esto es justamente lo que la planilla de la empresa no hace hoy
// con las notas de crédito. Los movimientos sin numeroDocto no tienen con qué
// agruparse, así que cada uno queda como su propia línea.
function calcularFacturasPendientes(movimientos: MovimientoMayor[], esActivo: boolean): FacturaPendiente[] {
  const grupos = new Map<string, MovimientoMayor[]>();
  let sinDoctoIndice = 0;
  for (const m of movimientos) {
    const clave = m.numeroDocto?.trim() ? m.numeroDocto.trim() : `__sin_docto_${sinDoctoIndice++}`;
    const lista = grupos.get(clave);
    if (lista) lista.push(m);
    else grupos.set(clave, [m]);
  }

  const resultado: FacturaPendiente[] = [];

  for (const [clave, movs] of grupos) {
    const totalInc = movs.reduce((s, m) => s + (esActivo ? m.debe : m.haber), 0);
    const totalDec = movs.reduce((s, m) => s + (esActivo ? m.haber : m.debe), 0);
    const pendiente = totalInc - totalDec;
    if (Math.abs(pendiente) <= TOLERANCIA) continue;

    // La "factura" del grupo es el movimiento con mayor monto creciente; si el
    // grupo no tiene ningún movimiento creciente, no hay factura asociada en
    // este cierre (ej: un pago que liquida un documento de un período anterior).
    const factura = movs.reduce((mejor, m) => {
      const incM = esActivo ? m.debe : m.haber;
      const incMejor = esActivo ? mejor.debe : mejor.haber;
      return incM > incMejor ? m : mejor;
    }, movs[0]);
    const tieneFactura = (esActivo ? factura.debe : factura.haber) > 0;

    const aplicaciones: AplicacionFactura[] = movs
      .filter((m) => m !== factura)
      .map((m) => ({
        fecha: m.fecha,
        numeroDocto: m.numeroDocto,
        glosa: m.glosa,
        monto: esActivo ? m.haber - m.debe : m.debe - m.haber,
      }));

    resultado.push({
      numeroDocto: clave.startsWith("__sin_docto_") ? null : clave,
      fecha: factura.fecha,
      glosa: tieneFactura
        ? factura.glosa
        : factura.glosa
          ? `${factura.glosa} (sin factura asociada en este cierre)`
          : "Sin factura asociada en este cierre",
      montoOriginal: totalInc,
      montoPendiente: pendiente,
      aplicaciones,
    });
  }

  resultado.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return resultado;
}

export interface AuxiliarEntidad {
  entidad: string;
  movimientos: MovimientoMayor[];
  totalDebe: number;
  totalHaber: number;
  saldoFinalDeudor: number;
  saldoFinalAcreedor: number;
  facturasPendientes: FacturaPendiente[];
}

export interface AuxiliarCuenta {
  cuenta: CuentaResumen;
  entidades: AuxiliarEntidad[];
  totalDebe: number;
  totalHaber: number;
  saldoFinalDeudor: number;
  saldoFinalAcreedor: number;
}

const SIN_IDENTIFICAR = "Sin identificar";

export async function obtenerAuxiliarCuenta(cierreId: string, cuentaId: string): Promise<AuxiliarCuenta | null> {
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
  if (!cuenta) return null;

  const asientos = await prisma.asiento.findMany({
    where: { cierreId, cuentaId },
    orderBy: [{ fecha: "asc" }, { numeroVoucher: "asc" }],
  });

  const porEntidad = new Map<string, typeof asientos>();
  for (const a of asientos) {
    const clave = a.codigoAnalisis?.trim() || SIN_IDENTIFICAR;
    const lista = porEntidad.get(clave);
    if (lista) lista.push(a);
    else porEntidad.set(clave, [a]);
  }

  const esActivo = esGrupoActivo(CATEGORIA_META[cuenta.categoria as Categoria].grupo);

  const entidades: AuxiliarEntidad[] = Array.from(porEntidad.entries()).map(([entidad, movs]) => {
    const resumen = construirMovimientos(movs);
    return {
      entidad,
      ...resumen,
      facturasPendientes: calcularFacturasPendientes(resumen.movimientos, esActivo),
    };
  });

  entidades.sort(
    (a, b) =>
      b.saldoFinalDeudor + b.saldoFinalAcreedor - (a.saldoFinalDeudor + a.saldoFinalAcreedor) ||
      a.entidad.localeCompare(b.entidad)
  );

  const totalDebe = asientos.reduce((s, a) => s + a.debe, 0);
  const totalHaber = asientos.reduce((s, a) => s + a.haber, 0);
  const saldoTotal = totalDebe - totalHaber;

  return {
    cuenta: { id: cuenta.id, codigo: cuenta.codigo, nombre: cuenta.nombre, categoria: cuenta.categoria },
    entidades,
    totalDebe,
    totalHaber,
    saldoFinalDeudor: saldoTotal > 0 ? saldoTotal : 0,
    saldoFinalAcreedor: saldoTotal < 0 ? -saldoTotal : 0,
  };
}

// ---------------------------------------------------------------------------
// Validación contra los reportes que exporta iContador directamente (Balance
// General y Facturas/Honorarios Pendientes de Pago), para detectar diferencias
// entre lo que la aplicación calcula a partir del libro diario y lo que el
// sistema contable de origen reporta.
// ---------------------------------------------------------------------------

export interface DiferenciaBalance {
  codigo: string;
  nombre: string;
  debeInterno: number;
  haberInterno: number;
  debeExterno: number;
  haberExterno: number;
  diferenciaDebe: number;
  diferenciaHaber: number;
}

export interface ValidacionBalance {
  archivoOrigen: string | null;
  fecha: Date;
  totalCuentasArchivo: number;
  totalCuentasComparadas: number;
  diferencias: DiferenciaBalance[];
  cuentasSoloEnIcontador: FilaBalanceExterno[];
}

export async function obtenerValidacionBalance(cierreId: string): Promise<ValidacionBalance | null> {
  const validacion = await prisma.validacionExterna.findFirst({
    where: { cierreId, tipo: "BALANCE" },
    orderBy: { createdAt: "desc" },
  });
  if (!validacion) return null;

  const filasExternas = validacion.datos as unknown as FilaBalanceExterno[];
  const balanceInterno = await obtenerBalanceComprobacion(cierreId);
  const porCodigo = new Map(balanceInterno.filas.filter((f) => f.codigo).map((f) => [f.codigo as string, f]));

  const diferencias: DiferenciaBalance[] = [];
  const cuentasSoloEnIcontador: FilaBalanceExterno[] = [];
  let totalCuentasComparadas = 0;

  for (const externa of filasExternas) {
    const interna = porCodigo.get(externa.codigo);
    if (!interna) {
      if (Math.abs(externa.debitos) > TOLERANCIA || Math.abs(externa.creditos) > TOLERANCIA) {
        cuentasSoloEnIcontador.push(externa);
      }
      continue;
    }
    totalCuentasComparadas++;
    const diferenciaDebe = interna.debe - externa.debitos;
    const diferenciaHaber = interna.haber - externa.creditos;
    if (Math.abs(diferenciaDebe) > TOLERANCIA || Math.abs(diferenciaHaber) > TOLERANCIA) {
      diferencias.push({
        codigo: externa.codigo,
        nombre: interna.nombre || externa.nombre,
        debeInterno: interna.debe,
        haberInterno: interna.haber,
        debeExterno: externa.debitos,
        haberExterno: externa.creditos,
        diferenciaDebe,
        diferenciaHaber,
      });
    }
  }

  diferencias.sort(
    (a, b) =>
      Math.abs(b.diferenciaDebe) + Math.abs(b.diferenciaHaber) - (Math.abs(a.diferenciaDebe) + Math.abs(a.diferenciaHaber))
  );

  return {
    archivoOrigen: validacion.archivoOrigen,
    fecha: validacion.createdAt,
    totalCuentasArchivo: filasExternas.length,
    totalCuentasComparadas,
    diferencias,
    cuentasSoloEnIcontador,
  };
}

function normalizarEntidad(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export interface DiferenciaAuxiliar {
  entidad: string;
  numero: string;
  saldoInterno: number | null;
  saldoExterno: number | null;
}

export interface ValidacionAuxiliar {
  archivoOrigen: string | null;
  fecha: Date;
  cuentaCodigo: string;
  cuentaNombre: string | null;
  totalDocumentosArchivo: number;
  diferencias: DiferenciaAuxiliar[];
}

// Compara, documento por documento, las facturas pendientes que calcula la
// aplicación a partir del libro diario contra las que reporta el archivo de
// iContador para esa misma cuenta. Como los dos reportes usan convenciones de
// signo distintas entre sí (confirmado con datos reales: Proveedores y
// Honorarios de iContador no comparten el mismo signo para un saldo acreedor),
// la comparación se hace por magnitud (valor absoluto) en vez de por signo.
export async function obtenerValidacionAuxiliar(cierreId: string, cuentaId: string): Promise<ValidacionAuxiliar | null> {
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
  if (!cuenta || !cuenta.codigo) return null;

  const validacion = await prisma.validacionExterna.findFirst({
    where: { cierreId, tipo: "AUXILIAR", cuentaCodigo: cuenta.codigo },
    orderBy: { createdAt: "desc" },
  });
  if (!validacion) return null;

  const externo = validacion.datos as unknown as AuxiliarExternoParseado;
  const auxiliarInterno = await obtenerAuxiliarCuenta(cierreId, cuentaId);
  if (!auxiliarInterno) return null;

  interface Item {
    entidad: string;
    numero: string;
    saldo: number;
  }

  const internoPorClave = new Map<string, Item>();
  for (const entidad of auxiliarInterno.entidades) {
    for (const factura of entidad.facturasPendientes) {
      const numero = factura.numeroDocto?.trim() || "(sin número)";
      const clave = `${normalizarEntidad(entidad.entidad)}|${normalizarEntidad(numero)}`;
      internoPorClave.set(clave, { entidad: entidad.entidad, numero, saldo: factura.montoPendiente });
    }
  }

  const externoPorClave = new Map<string, Item>();
  for (const factura of externo.facturas) {
    const clave = `${normalizarEntidad(factura.entidadNombre)}|${normalizarEntidad(factura.numero)}`;
    externoPorClave.set(clave, { entidad: factura.entidadNombre, numero: factura.numero, saldo: factura.saldo });
  }

  const claves = new Set([...internoPorClave.keys(), ...externoPorClave.keys()]);
  const diferencias: DiferenciaAuxiliar[] = [];

  for (const clave of claves) {
    const interno = internoPorClave.get(clave);
    const ext = externoPorClave.get(clave);
    const saldoInterno = interno ? Math.abs(interno.saldo) : null;
    const saldoExterno = ext ? Math.abs(ext.saldo) : null;
    if (saldoInterno !== null && saldoExterno !== null && Math.abs(saldoInterno - saldoExterno) <= TOLERANCIA) {
      continue;
    }
    diferencias.push({
      entidad: (interno ?? ext)!.entidad,
      numero: (interno ?? ext)!.numero,
      saldoInterno,
      saldoExterno,
    });
  }

  // Los documentos que aparecen en ambos lados pero con montos distintos suelen ser el
  // problema más urgente de revisar; los que solo aparecen de un lado casi siempre se
  // deben a que el reporte de iContador refleja pagos posteriores al cierre.
  diferencias.sort((a, b) => {
    const ambosA = a.saldoInterno !== null && a.saldoExterno !== null;
    const ambosB = b.saldoInterno !== null && b.saldoExterno !== null;
    if (ambosA !== ambosB) return ambosA ? -1 : 1;
    return a.entidad.localeCompare(b.entidad) || a.numero.localeCompare(b.numero);
  });

  return {
    archivoOrigen: validacion.archivoOrigen,
    fecha: validacion.createdAt,
    cuentaCodigo: cuenta.codigo,
    cuentaNombre: validacion.cuentaNombre,
    totalDocumentosArchivo: externo.facturas.length,
    diferencias,
  };
}
