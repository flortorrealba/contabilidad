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

function hojaEstadoResultados(estado: EstadoResultados): (string | number)[][] {
  const encabezado = ["Estado de Resultados", ...estado.meses.map((m) => NOMBRES_MESES[m - 1]), "Acumulado"];
  const filas: (string | number)[][] = [encabezado];

  const agregarSeccion = (seccion: EstadoResultados["secciones"][number]) => {
    if (seccion.lineas.length === 0) return;
    filas.push([seccion.label, ...seccion.montosPorMes, seccion.total]);
    for (const linea of seccion.lineas) {
      filas.push([`  ${linea.nombre}`, ...linea.montosPorMes, linea.total]);
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

  return filas;
}

function hojaEFF(eff: EstadoSituacionFinanciera): (string | number)[][] {
  const filas: (string | number)[][] = [["Estado de Situación Financiera Clasificado", "Monto"]];

  const agregarGrupo = (grupo: GrupoEFF) => {
    if (grupo.categorias.length === 0) return;
    filas.push([grupo.label, grupo.total]);
    for (const categoria of grupo.categorias) {
      filas.push([`  ${categoria.label}`, categoria.total]);
      for (const linea of categoria.lineas) {
        filas.push([`    ${linea.nombre}`, linea.monto]);
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

  return filas;
}

export function generarExcelCierre(
  nombreCierre: string,
  balance: BalanceComprobacion,
  estado: EstadoResultados,
  eff: EstadoSituacionFinanciera
): Buffer {
  const workbook = XLSX.utils.book_new();

  const hojaER = XLSX.utils.aoa_to_sheet(hojaEstadoResultados(estado));
  XLSX.utils.book_append_sheet(workbook, hojaER, "Estado de Resultados");

  const hojaEFFSheet = XLSX.utils.aoa_to_sheet(hojaEFF(eff));
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
