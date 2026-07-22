import ExcelJS from "exceljs";
import type { BalanceComprobacion, EstadoResultados, EstadoSituacionFinanciera, GrupoEFF } from "@/lib/reportes";
import { NOMBRES_MESES } from "@/lib/format";

const FUENTE_EMPRESA: Partial<ExcelJS.Font> = { bold: true, size: 14 };
const FUENTE_TITULO_HOJA: Partial<ExcelJS.Font> = { bold: true, size: 11 };
const FUENTE_NEGRITA: Partial<ExcelJS.Font> = { bold: true };

// Fila "Nombre de la empresa" + fila "Título del reporte", ambas en negrita y
// combinadas a lo ancho de la tabla, seguidas de una fila en blanco.
function agregarEncabezado(sheet: ExcelJS.Worksheet, nombreEmpresa: string, tituloReporte: string, columnas: number) {
  sheet.mergeCells(1, 1, 1, columnas);
  const filaEmpresa = sheet.getCell(1, 1);
  filaEmpresa.value = nombreEmpresa;
  filaEmpresa.font = FUENTE_EMPRESA;

  sheet.mergeCells(2, 1, 2, columnas);
  const filaTitulo = sheet.getCell(2, 1);
  filaTitulo.value = tituloReporte;
  filaTitulo.font = FUENTE_TITULO_HOJA;

  sheet.addRow([]);
}

function agregarFila(
  sheet: ExcelJS.Worksheet,
  valores: (string | number)[],
  opciones: { negrita?: boolean; detalle?: boolean } = {}
) {
  const fila = sheet.addRow(valores);
  if (opciones.negrita) fila.font = FUENTE_NEGRITA;
  if (opciones.detalle) {
    fila.outlineLevel = 1;
    fila.hidden = true;
  }
  return fila;
}

function hojaBalance(sheet: ExcelJS.Worksheet, nombreEmpresa: string, nombreCierre: string, balance: BalanceComprobacion) {
  agregarEncabezado(sheet, nombreEmpresa, `Balance de Comprobación · ${nombreCierre}`, 6);

  agregarFila(sheet, ["Código", "Cuenta", "Debe", "Haber", "Saldo Deudor", "Saldo Acreedor"], { negrita: true });
  for (const f of balance.filas) {
    agregarFila(sheet, [f.codigo ?? "", f.nombre, f.debe, f.haber, f.saldoDeudor, f.saldoAcreedor]);
  }
  agregarFila(
    sheet,
    ["", "Totales", balance.totalDebe, balance.totalHaber, balance.totalSaldoDeudor, balance.totalSaldoAcreedor],
    { negrita: true }
  );
}

function hojaEstadoResultados(sheet: ExcelJS.Worksheet, nombreEmpresa: string, nombreCierre: string, estado: EstadoResultados) {
  const columnas = 1 + estado.meses.length + 1;
  agregarEncabezado(sheet, nombreEmpresa, `Estado de Resultados · ${nombreCierre}`, columnas);

  agregarFila(sheet, ["Estado de Resultados", ...estado.meses.map((m) => NOMBRES_MESES[m - 1]), "Acumulado"], {
    negrita: true,
  });

  const agregarSeccion = (seccion: EstadoResultados["secciones"][number]) => {
    if (seccion.lineas.length === 0) return;
    agregarFila(sheet, [seccion.label, ...seccion.montosPorMes, seccion.total], { negrita: true });
    for (const linea of seccion.lineas) {
      agregarFila(sheet, [`  ${linea.nombre}`, ...linea.montosPorMes, linea.total], { detalle: true });
    }
  };

  const [ingresos, costoVentas, gastosAdmin, costosFinancieros, otrasGanancias, impuesto] = estado.secciones;

  agregarSeccion(ingresos);
  agregarSeccion(costoVentas);
  agregarFila(sheet, ["MARGEN BRUTO", ...estado.margenBruto.montosPorMes, estado.margenBruto.total], {
    negrita: true,
  });
  agregarSeccion(gastosAdmin);
  agregarFila(sheet, ["EBITDA", ...estado.ebitda.montosPorMes, estado.ebitda.total], { negrita: true });
  agregarSeccion(costosFinancieros);
  agregarSeccion(otrasGanancias);
  agregarSeccion(impuesto);
  agregarFila(
    sheet,
    ["RESULTADO ANTES DE IMPUESTOS", ...estado.resultadoAntesImpuestos.montosPorMes, estado.resultadoAntesImpuestos.total],
    { negrita: true }
  );

  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
}

function hojaEFF(sheet: ExcelJS.Worksheet, nombreEmpresa: string, nombreCierre: string, eff: EstadoSituacionFinanciera) {
  agregarEncabezado(sheet, nombreEmpresa, `Estado de Situación Financiera Clasificado · ${nombreCierre}`, 2);

  agregarFila(sheet, ["Estado de Situación Financiera Clasificado", "Monto"], { negrita: true });

  const agregarGrupo = (grupo: GrupoEFF) => {
    if (grupo.categorias.length === 0) return;
    agregarFila(sheet, [grupo.label, grupo.total], { negrita: true });
    for (const categoria of grupo.categorias) {
      agregarFila(sheet, [`  ${categoria.label}`, categoria.total], { negrita: true });
      for (const linea of categoria.lineas) {
        agregarFila(sheet, [`    ${linea.nombre}`, linea.monto], { detalle: true });
      }
    }
  };

  agregarFila(sheet, ["ACTIVOS", ""], { negrita: true });
  agregarGrupo(eff.activoCorriente);
  agregarGrupo(eff.activoNoCorriente);
  agregarFila(sheet, ["TOTAL ACTIVOS", eff.totalActivos], { negrita: true });
  agregarFila(sheet, ["", ""]);
  agregarFila(sheet, ["PATRIMONIO Y PASIVOS", ""], { negrita: true });
  agregarGrupo(eff.pasivoCorriente);
  agregarGrupo(eff.pasivoNoCorriente);
  agregarGrupo(eff.patrimonio);
  agregarFila(sheet, ["TOTAL PATRIMONIO Y PASIVOS", eff.totalPatrimonioYPasivos], { negrita: true });

  sheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
}

export async function generarExcelCierre(
  nombreEmpresa: string,
  nombreCierre: string,
  balance: BalanceComprobacion,
  estado: EstadoResultados,
  eff: EstadoSituacionFinanciera
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  hojaEstadoResultados(workbook.addWorksheet("Estado de Resultados"), nombreEmpresa, nombreCierre, estado);
  hojaEFF(workbook.addWorksheet("Estado Situacion Financiera"), nombreEmpresa, nombreCierre, eff);
  hojaBalance(workbook.addWorksheet("Balance de Comprobacion"), nombreEmpresa, nombreCierre, balance);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
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
