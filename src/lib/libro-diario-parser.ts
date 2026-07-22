import * as XLSX from "xlsx";

export interface AsientoParseado {
  fecha: Date;
  mes: number;
  tipo: string | null;
  numeroVoucher: string | null;
  cuentaCodigo: string | null;
  cuentaNombre: string;
  numeroDocto: string | null;
  codigoAnalisis: string | null;
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
  "CODIGO ANALISIS": "codigoAnalisis",
  "COD ANALISIS": "codigoAnalisis",
  ANALISIS: "codigoAnalisis",
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
  codigoAnalisis?: number;
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

// El "Libro Mayor Tributario Jornalizador" que exporta iContador no es un libro diario
// plano: en vez de traer la cuenta como columna de cada fila, agrupa los movimientos en
// bloques por cuenta (una fila con el código/nombre de la cuenta y su saldo de arrastre,
// luego sus movimientos del período, y filas de subtotal al cerrar el bloque). Este parser
// reconstruye asientos individuales asignándoles la cuenta del bloque en el que aparecen.
const ALIAS_COLUMNAS_MAYOR: Record<string, keyof ColumnMapMayor> = {
  FECHA: "fecha",
  TIPO: "tipo",
  NUMERO: "numero",
  DOCTO: "docto",
  "COD ANALISIS": "codigoAnalisis",
  "CODIGO ANALISIS": "codigoAnalisis",
  GLOSA: "glosa",
  DEBE: "debe",
  HABER: "haber",
};

interface ColumnMapMayor {
  fecha?: number;
  tipo?: number;
  numero?: number;
  docto?: number;
  codigoAnalisis?: number;
  glosa?: number;
  debe?: number;
  haber?: number;
}

const ETIQUETAS_SUBTOTAL_MAYOR = new Set([
  "TOTALES DEL PERIODO",
  "SALDO DEL PERIODO",
  "TOTALES A LA FECHA",
  "SALDO A LA FECHA",
]);

function detectarEncabezadoMayor(matriz: unknown[][]): { fila: number; columnas: ColumnMapMayor } | null {
  const maxFilas = Math.min(matriz.length, 30);
  for (let i = 0; i < maxFilas; i++) {
    const fila = matriz[i];
    if (!fila) continue;
    const columnas: ColumnMapMayor = {};
    fila.forEach((celda, idx) => {
      const clave = ALIAS_COLUMNAS_MAYOR[normalizar(celda)];
      if (clave && columnas[clave] === undefined) {
        columnas[clave] = idx;
      }
    });
    if (
      columnas.fecha !== undefined &&
      columnas.glosa !== undefined &&
      columnas.debe !== undefined &&
      columnas.haber !== undefined
    ) {
      return { fila: i, columnas };
    }
  }
  return null;
}

// El encabezado de la hoja trae "Comprendido entre el DD-MM-YYYY y DD-MM-YYYY": se usa
// como fecha para los saldos de arrastre (el inicio del período), ya que esas filas no
// traen su propia fecha.
function detectarFechaInicioPeriodo(matriz: unknown[][]): Date | null {
  for (const fila of matriz.slice(0, 15)) {
    if (!fila) continue;
    for (const c of fila) {
      const m = String(c ?? "").match(/entre el\s+(\d{1,2}-\d{2}-\d{4})\s+y\s+\d{1,2}-\d{2}-\d{4}/i);
      if (m) return parseFecha(m[1]);
    }
  }
  return null;
}

function parseHojaMayor(nombreHoja: string, matriz: unknown[][]): ResultadoParseo | null {
  const contieneTitulo = matriz
    .slice(0, 15)
    .some((fila) => fila?.some((celda) => normalizar(celda).includes("LIBRO MAYOR")));
  if (!contieneTitulo) return null;

  const encabezado = detectarEncabezadoMayor(matriz);
  if (!encabezado) return null;

  const { fila: filaEncabezado, columnas } = encabezado;
  const fechaInicioPeriodo = detectarFechaInicioPeriodo(matriz);
  const asientos: AsientoParseado[] = [];
  const advertencias: string[] = [];
  let filasOmitidas = 0;
  let cuentaActual: { codigo: string; nombre: string } | null = null;
  let avisoSaldoInicialSinFecha = false;

  for (let i = filaEncabezado + 1; i < matriz.length; i++) {
    const fila = matriz[i];
    if (!fila || fila.every((c) => c === null || c === undefined || c === "")) continue;

    // Fila que abre un bloque de cuenta nueva: trae "Saldo al DD-MM-YYYY" en alguna
    // columna, con el código en la primera y el nombre en la segunda. Si ese saldo de
    // arrastre no es cero, se agrega como un asiento propio para que la cuenta no quede
    // descuadrada frente al saldo real al inicio del período.
    const esInicioBloque = fila.some((c) => /^saldo al\b/i.test(String(c ?? "").trim()));
    if (esInicioBloque) {
      const codigo = textoONull(fila[0]);
      const nombre = textoONull(fila[1]);
      if (codigo && nombre) {
        cuentaActual = { codigo, nombre: nombre.toUpperCase() };
      }
      const debeInicial = parseNumero(celda(fila, columnas.debe));
      const haberInicial = parseNumero(celda(fila, columnas.haber));
      if (cuentaActual && (debeInicial !== 0 || haberInicial !== 0)) {
        if (fechaInicioPeriodo) {
          asientos.push({
            fecha: fechaInicioPeriodo,
            mes: fechaInicioPeriodo.getUTCMonth() + 1,
            tipo: null,
            numeroVoucher: null,
            cuentaCodigo: cuentaActual.codigo,
            cuentaNombre: cuentaActual.nombre,
            numeroDocto: null,
            codigoAnalisis: null,
            glosa: "Saldo inicial (arrastre del período anterior)",
            debe: debeInicial,
            haber: haberInicial,
          });
        } else {
          avisoSaldoInicialSinFecha = true;
        }
      }
      continue;
    }

    // Filas de subtotal/saldo al cierre de cada bloque: no son asientos.
    if (fila.some((c) => ETIQUETAS_SUBTOTAL_MAYOR.has(normalizar(c)))) continue;

    const fecha = parseFecha(celda(fila, columnas.fecha));
    if (!fecha) {
      filasOmitidas++;
      continue;
    }
    if (!cuentaActual) {
      filasOmitidas++;
      continue;
    }

    const debe = parseNumero(celda(fila, columnas.debe));
    const haber = parseNumero(celda(fila, columnas.haber));
    if (debe === 0 && haber === 0) {
      filasOmitidas++;
      continue;
    }

    asientos.push({
      fecha,
      mes: fecha.getUTCMonth() + 1,
      tipo: textoONull(celda(fila, columnas.tipo)),
      numeroVoucher: textoONull(celda(fila, columnas.numero)),
      cuentaCodigo: cuentaActual.codigo,
      cuentaNombre: cuentaActual.nombre,
      numeroDocto: textoONull(celda(fila, columnas.docto)),
      codigoAnalisis: textoONull(celda(fila, columnas.codigoAnalisis)),
      glosa: textoONull(celda(fila, columnas.glosa)),
      debe,
      haber,
    });
  }

  if (avisoSaldoInicialSinFecha) {
    advertencias.push(
      "Algunas cuentas traen saldo de arrastre del período anterior pero no se pudo determinar la fecha de inicio del período (falta la línea \"Comprendido entre el ... y ...\"); esos saldos no se incluyeron."
    );
  }

  if (asientos.length === 0) return null;

  return { hoja: nombreHoja, asientos, filasOmitidas, advertencias };
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
      codigoAnalisis: textoONull(celda(fila, columnas.codigoAnalisis)),
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
    const resultado = parseHoja(nombreHoja, matriz) ?? parseHojaMayor(nombreHoja, matriz);
    if (resultado && (!mejorResultado || resultado.asientos.length > mejorResultado.asientos.length)) {
      mejorResultado = resultado;
    }
  }

  if (!mejorResultado) {
    throw new Error(
      "No se pudo detectar el libro diario ni el libro mayor en el archivo. Asegúrate de que exista una hoja con columnas Fecha, Debe y Haber (libro diario), o el Libro Mayor Tributario Jornalizador que exporta iContador."
    );
  }

  return mejorResultado;
}
