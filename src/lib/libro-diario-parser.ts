import * as XLSX from "xlsx";

export interface AsientoParseado {
  fecha: Date;
  mes: number;
  tipo: string | null;
  numeroVoucher: string | null;
  cuentaCodigo: string | null;
  cuentaNombre: string;
  numeroDocto: string | null;
  glosa: string | null;
  debe: number;
  haber: number;
}

export interface ResultadoParseo {
  hoja: string;
  asientos: AsientoParseado[];
  filasOmitidas: number;
  advertencias: string[];
}

const ALIAS_COLUMNAS: Record<string, keyof ColumnMap> = {
  FECHA: "fecha",
  TIPO: "tipo",
  "N VOUCHER": "numeroVoucher",
  "NUMERO VOUCHER": "numeroVoucher",
  VOUCHER: "numeroVoucher",
  CUENTA: "cuentaCodigo",
  "NOMBRE CUENTA": "cuentaNombre",
  "NOMBRE DE LA CUENTA": "cuentaNombre",
  "N DOCTO": "numeroDocto",
  "N DOCTO.": "numeroDocto",
  "NUMERO DOCTO": "numeroDocto",
  "NRO DOCTO": "numeroDocto",
  GLOSA: "glosa",
  DETALLE: "glosa",
  DESCRIPCION: "glosa",
  DEBE: "debe",
  HABER: "haber",
};

interface ColumnMap {
  fecha?: number;
  tipo?: number;
  numeroVoucher?: number;
  cuentaCodigo?: number;
  cuentaNombre?: number;
  numeroDocto?: number;
  glosa?: number;
  debe?: number;
  haber?: number;
}

function normalizar(texto: unknown): string {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[°º.]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function parseNumero(valor: unknown): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return valor;
  let texto = String(valor).trim();
  if (texto === "") return 0;
  const negativo = /^-|\(.*\)$/.test(texto);
  texto = texto.replace(/[()\s$]/g, "").replace(/^-/, "");
  const tieneComa = texto.includes(",");
  const tienePunto = texto.includes(".");
  if (tieneComa && tienePunto) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (tieneComa) {
    texto = texto.replace(",", ".");
  } else if (tienePunto) {
    const partes = texto.split(".");
    if (partes.length > 2 || partes[partes.length - 1].length === 3) {
      texto = texto.replace(/\./g, "");
    }
  }
  const numero = parseFloat(texto);
  if (Number.isNaN(numero)) return 0;
  return negativo ? -numero : numero;
}

const MESES_ES: Record<string, number> = {
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
  JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12,
};

function parseFecha(valor: unknown): Date | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor;
  if (typeof valor === "number") {
    const parsed = XLSX.SSF.parse_date_code(valor);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const texto = String(valor).trim();
  let m = texto.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  m = texto.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  m = texto.match(/^(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚ]+)\s+DE\s+(\d{4})$/i);
  if (m) {
    const mes = MESES_ES[normalizar(m[2])];
    if (mes) {
      const date = new Date(Date.UTC(Number(m[3]), mes - 1, Number(m[1])));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}

function detectarEncabezado(matriz: unknown[][]): { fila: number; columnas: ColumnMap } | null {
  const maxFilas = Math.min(matriz.length, 30);
  for (let i = 0; i < maxFilas; i++) {
    const fila = matriz[i];
    if (!fila) continue;
    const columnas: ColumnMap = {};
    fila.forEach((celda, idx) => {
      const clave = ALIAS_COLUMNAS[normalizar(celda)];
      if (clave && columnas[clave] === undefined) {
        columnas[clave] = idx;
      }
    });
    if (columnas.fecha !== undefined && columnas.debe !== undefined && columnas.haber !== undefined) {
      return { fila: i, columnas };
    }
  }
  return null;
}

function celda(fila: unknown[], indice: number | undefined): unknown {
  if (indice === undefined) return null;
  return fila[indice] ?? null;
}

function textoONull(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

function parseHoja(nombreHoja: string, matriz: unknown[][]): ResultadoParseo | null {
  const encabezado = detectarEncabezado(matriz);
  if (!encabezado) return null;

  const { fila: filaEncabezado, columnas } = encabezado;
  const asientos: AsientoParseado[] = [];
  const advertencias: string[] = [];
  let filasOmitidas = 0;

  for (let i = filaEncabezado + 1; i < matriz.length; i++) {
    const fila = matriz[i];
    if (!fila || fila.every((c) => c === null || c === undefined || c === "")) continue;

    const fecha = parseFecha(celda(fila, columnas.fecha));
    const cuentaNombreRaw = textoONull(celda(fila, columnas.cuentaNombre));
    const cuentaCodigoRaw = textoONull(celda(fila, columnas.cuentaCodigo));
    const debe = parseNumero(celda(fila, columnas.debe));
    const haber = parseNumero(celda(fila, columnas.haber));

    if (!fecha) {
      filasOmitidas++;
      continue;
    }
    const cuentaNombre = cuentaNombreRaw ?? cuentaCodigoRaw;
    if (!cuentaNombre) {
      filasOmitidas++;
      continue;
    }
    if (debe === 0 && haber === 0) {
      filasOmitidas++;
      continue;
    }

    asientos.push({
      fecha,
      mes: fecha.getUTCMonth() + 1,
      tipo: textoONull(celda(fila, columnas.tipo)),
      numeroVoucher: textoONull(celda(fila, columnas.numeroVoucher)),
      cuentaCodigo: cuentaCodigoRaw,
      cuentaNombre: cuentaNombre.toUpperCase(),
      numeroDocto: textoONull(celda(fila, columnas.numeroDocto)),
      glosa: textoONull(celda(fila, columnas.glosa)),
      debe,
      haber,
    });
  }

  if (asientos.length === 0) return null;

  return { hoja: nombreHoja, asientos, filasOmitidas, advertencias };
}

export function parseLibroDiario(buffer: Buffer, nombreArchivo: string): ResultadoParseo {
  const esCsv = /\.csv$/i.test(nombreArchivo);
  const workbook = esCsv
    ? XLSX.read(buffer.toString("utf-8"), { type: "string", cellDates: true })
    : XLSX.read(buffer, { type: "buffer", cellDates: true });

  let mejorResultado: ResultadoParseo | null = null;

  for (const nombreHoja of workbook.SheetNames) {
    const hoja = workbook.Sheets[nombreHoja];
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: null });
    const resultado = parseHoja(nombreHoja, matriz);
    if (resultado && (!mejorResultado || resultado.asientos.length > mejorResultado.asientos.length)) {
      mejorResultado = resultado;
    }
  }

  if (!mejorResultado) {
    throw new Error(
      "No se pudo detectar el libro diario en el archivo. Asegúrate de que exista una hoja con columnas Fecha, Debe y Haber."
    );
  }

  return mejorResultado;
}
