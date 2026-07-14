import * as XLSX from "xlsx";
import type { BalanceComprobacion, EstadoResultados } from "@/lib/reportes";
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

export function generarExcelCierre(
  nombreCierre: string,
  balance: BalanceComprobacion,
  estado: EstadoResultados
): Buffer {
  const workbook = XLSX.utils.book_new();

  const hojaER = XLSX.utils.aoa_to_sheet(hojaEstadoResultados(estado));
  XLSX.utils.book_append_sheet(workbook, hojaER, "Estado de Resultados");

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
