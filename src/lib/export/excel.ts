import * as XLSX from "xlsx";
import type { BalanceComprobacion, EstadoResultados, EstadoSituacionFinanciera, GrupoEFF } from "@/lib/reportes";
import { NOMBRES_MESES } from "@/lib/format";

function hojaBalance(balance: BalanceComprobacion): (string | number)[][] {
  const filas: (string | number)[][] = [
    ["Código", "Cuenta", "Debe", "Haber", "Saldo Deudor", "Saldo Acreedor"],
  ];
  for (const f of balance.filas) {
    filas.push([f.codigo ?? "", f.nombre, f.debe, f.haber, f.saldoDeudor, f.saldoAcreedor]);
  }
  filas.push([
    "",
    "Totales",
    balance.totalDebe,
    balance.totalHaber,
    balance.totalSaldoDeudor,
    balance.totalSaldoAcreedor,
  ]);
  return filas;
}

interface HojaConDetalle {
  filas: (string | number)[][];
  // Índices (0-based, incluyendo el encabezado) de las filas de detalle que deben
  // quedar agrupadas y colapsadas por defecto bajo su subtotal, usando la función
  // "Agrupar y esquematizar" de Excel.
  filasDetalle: number[];
}

function hojaEstadoResultados(estado: EstadoResultados): HojaConDetalle {
  const encabezado = ["Estado de Resultados", ...estado.meses.map((m) => NOMBRES_MESES[m - 1]), "Acumulado"];
  const filas: (string | number)[][] = [encabezado];
  const filasDetalle: number[] = [];

  const agregarSeccion = (seccion: EstadoResultados["secciones"][number]) => {
    if (seccion.lineas.length === 0) return;
    filas.push([seccion.label, ...seccion.montosPorMes, seccion.total]);
    for (const linea of seccion.lineas) {
      filas.push([`  ${linea.nombre}`, ...linea.montosPorMes, linea.total]);
      filasDetalle.push(filas.length - 1);
    }
  };

  const [ingresos, costoVentas, gastosAdmin, costosFinancieros, otrasGanancias, impuesto] = estado.secciones;

  agregarSeccion(ingresos);
  agregarSeccion(costoVentas);
  filas.push(["MARGEN BRUTO", ...estado.margenBruto.montosPorMes, estado.margenBruto.total]);
  agregarSeccion(gastosAdmin);
  filas.push(["EBITDA", ...estado.ebitda.montosPorMes, estado.ebitda.total]);
  agregarSeccion(costosFinancieros);
  agregarSeccion(otrasGanancias);
  agregarSeccion(impuesto);
  filas.push([
    "RESULTADO ANTES DE IMPUESTOS",
    ...estado.resultadoAntesImpuestos.montosPorMes,
    estado.resultadoAntesImpuestos.total,
  ]);

  return { filas, filasDetalle };
}

function hojaEFF(eff: EstadoSituacionFinanciera): HojaConDetalle {
  const filas: (string | number)[][] = [["Estado de Situación Financiera Clasificado", "Monto"]];
  const filasDetalle: number[] = [];

  const agregarGrupo = (grupo: GrupoEFF) => {
    if (grupo.categorias.length === 0) return;
    filas.push([grupo.label, grupo.total]);
    for (const categoria of grupo.categorias) {
      filas.push([`  ${categoria.label}`, categoria.total]);
      for (const linea of categoria.lineas) {
        filas.push([`    ${linea.nombre}`, linea.monto]);
        filasDetalle.push(filas.length - 1);
      }
    }
  };

  filas.push(["ACTIVOS", ""]);
  agregarGrupo(eff.activoCorriente);
  agregarGrupo(eff.activoNoCorriente);
  filas.push(["TOTAL ACTIVOS", eff.totalActivos]);
  filas.push(["", ""]);
  filas.push(["PATRIMONIO Y PASIVOS", ""]);
  agregarGrupo(eff.pasivoCorriente);
  agregarGrupo(eff.pasivoNoCorriente);
  agregarGrupo(eff.patrimonio);
  filas.push(["TOTAL PATRIMONIO Y PASIVOS", eff.totalPatrimonioYPasivos]);

  return { filas, filasDetalle };
}

// Agrupa (y colapsa por defecto) las filas de detalle indicadas, usando la función
// "Agrupar y esquematizar" de Excel — el subtotal queda siempre visible y las
// cuentas debajo se ocultan hasta que el usuario apreta el "+".
function aplicarAgrupacion(ws: XLSX.WorkSheet, filasDetalle: number[]) {
  if (filasDetalle.length === 0) return;
  ws["!outline"] = { above: true };
  const filas: XLSX.RowInfo[] = ws["!rows"] ?? [];
  for (const indice of filasDetalle) {
    filas[indice] = { ...filas[indice], level: 1, hidden: true };
  }
  ws["!rows"] = filas;
}

export function generarExcelCierre(
  nombreCierre: string,
  balance: BalanceComprobacion,
  estado: EstadoResultados,
  eff: EstadoSituacionFinanciera
): Buffer {
  const workbook = XLSX.utils.book_new();

  const datosER = hojaEstadoResultados(estado);
  const hojaER = XLSX.utils.aoa_to_sheet(datosER.filas);
  aplicarAgrupacion(hojaER, datosER.filasDetalle);
  XLSX.utils.book_append_sheet(workbook, hojaER, "Estado de Resultados");

  const datosEFF = hojaEFF(eff);
  const hojaEFFSheet = XLSX.utils.aoa_to_sheet(datosEFF.filas);
  aplicarAgrupacion(hojaEFFSheet, datosEFF.filasDetalle);
  XLSX.utils.book_append_sheet(workbook, hojaEFFSheet, "Estado Situacion Financiera");

  const hojaBC = XLSX.utils.aoa_to_sheet(hojaBalance(balance));
  XLSX.utils.book_append_sheet(workbook, hojaBC, "Balance de Comprobacion");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function nombreArchivo(nombreCierre: string, extension: string) {
  const slug = nombreCierre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug || "cierre"}.${extension}`;
}
