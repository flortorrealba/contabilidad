import * as XLSX from "xlsx";

// Parsers para los reportes que exporta iContador directamente (no el libro diario):
// el "Balance General" (todas las cuentas) y los reportes "Facturas/Honorarios
// Pendientes de Pago" por cuenta (clientes, proveedores, honorarios). Se usan para
// validar, cruzándolos, contra lo que la aplicación calcula a partir del libro diario.

function limpiarNumero(valor: unknown): number {
  const texto = String(valor ?? "").trim();
  if (!texto || texto === "-") return 0;
  const numero = Number(texto.replace(/,/g, ""));
  return Number.isNaN(numero) ? 0 : numero;
}

function esFilaFecha(valor: unknown): boolean {
  return /^\d{1,2}-\d{2}-\d{4}$/.test(String(valor ?? "").trim());
}

function parseFechaDDMMYYYY(valor: unknown): Date | null {
  const m = String(valor ?? "").trim().match(/^(\d{1,2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const fecha = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function leerFilas(buffer: Buffer, hojaPreferida: string): string[][] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const nombreHoja = workbook.SheetNames.includes(hojaPreferida) ? hojaPreferida : workbook.SheetNames[0];
  const hoja = workbook.Sheets[nombreHoja];
  return XLSX.utils.sheet_to_json<string[]>(hoja, { header: 1, raw: false, defval: "" });
}

export interface FilaBalanceExterno {
  codigo: string;
  nombre: string;
  debitos: number;
  creditos: number;
}

// Parsea la hoja "Balance" del Libro Mayor/Balance General de iContador: una fila
// por cuenta con sus totales de Débitos y Créditos del período.
export function parsearBalanceExterno(buffer: Buffer): FilaBalanceExterno[] {
  const filas = leerFilas(buffer, "Balance");

  let filaEncabezado = -1;
  for (let i = 0; i < filas.length; i++) {
    if (String(filas[i][0]).trim() === "Cuenta" && String(filas[i][1]).trim() === "Nombre") {
      filaEncabezado = i;
      break;
    }
  }
  if (filaEncabezado === -1) {
    throw new Error(
      'No se encontró la tabla de cuentas (fila con encabezados "Cuenta" y "Nombre"). ¿Es el archivo de Balance de iContador?'
    );
  }

  const resultado: FilaBalanceExterno[] = [];
  for (let i = filaEncabezado + 1; i < filas.length; i++) {
    const fila = filas[i];
    const codigo = String(fila[0] ?? "").trim();
    const nombre = String(fila[1] ?? "").trim();
    if (!codigo || !nombre) continue;
    resultado.push({
      codigo,
      nombre,
      debitos: limpiarNumero(fila[2]),
      creditos: limpiarNumero(fila[3]),
    });
  }

  if (resultado.length === 0) {
    throw new Error("No se encontraron cuentas en el archivo de Balance.");
  }

  return resultado;
}

export interface FacturaPendienteExterna {
  entidadRut: string;
  entidadNombre: string;
  numero: string;
  fecha: Date | null;
  tipo: string | null;
  glosa: string | null;
  saldo: number;
}

export interface AuxiliarExternoParseado {
  cuentaCodigo: string;
  cuentaNombre: string;
  facturas: FacturaPendienteExterna[];
  totalDebito: number;
  totalCredito: number;
  totalSaldo: number;
}

// Parsea los reportes "Facturas Pendientes de Pago" / "Honorarios Pendientes de Pago"
// que exporta iContador para una cuenta específica (hoja "ORIGEN" en las planillas de
// la empresa). El archivo trae, por cliente/proveedor/persona, cada documento con un
// saldo acumulado ("Saldo :") que ya neteia pagos y notas de crédito que comparten el
// mismo número de documento — por eso se usa el último saldo visto por número.
export function parsearAuxiliarExterno(buffer: Buffer): AuxiliarExternoParseado {
  const filas = leerFilas(buffer, "ORIGEN");

  let cuentaCodigo = "";
  let cuentaNombre = "";
  let filaEncabezado = -1;
  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    if (String(fila[3] ?? "").trim().toUpperCase() === "CUENTA") {
      const match = String(fila[4] ?? "").match(/\(([^)]+)\)\s*(.*)/);
      if (match) {
        cuentaCodigo = match[1].trim();
        cuentaNombre = match[2].trim();
      }
    }
    if (String(fila[0] ?? "").trim() === "Fecha" && String(fila[1] ?? "").trim().startsWith("Fecha")) {
      filaEncabezado = i;
      break;
    }
  }
  if (filaEncabezado === -1) {
    throw new Error(
      'No se encontró la tabla de documentos (fila con encabezados "Fecha", "Fecha Doc", ...). ¿Es un reporte de Facturas/Honorarios Pendientes de Pago de iContador?'
    );
  }

  const facturas: FacturaPendienteExterna[] = [];
  let entidadRut = "";
  let entidadNombre = "";
  let porNumero = new Map<string, FacturaPendienteExterna>();
  let ultimoNumero: string | null = null;
  let totalDebito = 0;
  let totalCredito = 0;

  const cerrarEntidad = () => {
    for (const factura of porNumero.values()) {
      if (Math.abs(factura.saldo) > 1) facturas.push(factura);
    }
    porNumero = new Map();
    ultimoNumero = null;
  };

  for (let i = filaEncabezado + 1; i < filas.length; i++) {
    const fila = filas[i];
    const c0 = String(fila[0] ?? "").trim();
    const c1 = String(fila[1] ?? "").trim();
    const c6 = String(fila[6] ?? "").trim();
    const c7 = String(fila[7] ?? "").trim();

    if (!c0 && !c1 && !c6 && !c7) continue;

    if (c0 === "TOTAL") {
      cerrarEntidad();
      break;
    }

    if (esFilaFecha(c0)) {
      totalDebito += limpiarNumero(fila[6]);
      totalCredito += limpiarNumero(fila[7]);

      // Las notas de crédito traen su propio número de documento en la columna
      // "Número", pero la columna "Voucher" referencia la factura que están
      // liquidando con un patrón como "NCE - 10130487". Cuando existe esa
      // referencia y la factura ya está abierta, el saldo se acumula ahí en vez
      // de crear un documento nuevo — así el saldo pendiente queda igual al que
      // ya calcula iContador en su propia columna "Saldo".
      const numeroPropio = String(fila[3] ?? "").trim();
      const voucher = String(fila[4] ?? "").trim();
      const referencia = voucher.match(/^(?:NCE|NC|CN)\s*-\s*(\S+)$/i)?.[1];
      const numero = referencia && porNumero.has(referencia) ? referencia : numeroPropio;

      let factura = porNumero.get(numero);
      if (!factura) {
        factura = {
          entidadRut,
          entidadNombre,
          numero,
          fecha: parseFechaDDMMYYYY(c0),
          tipo: String(fila[2] ?? "").trim() || null,
          glosa: String(fila[5] ?? "").trim() || null,
          saldo: 0,
        };
        porNumero.set(numero, factura);
      }
      ultimoNumero = numero;
      continue;
    }

    if (c7 === "Saldo :") {
      if (ultimoNumero) {
        const factura = porNumero.get(ultimoNumero);
        if (factura) factura.saldo = limpiarNumero(fila[8]);
      }
      continue;
    }

    // Fila de subtotal por entidad: sin fecha/nombre pero con débito o crédito.
    if (!c0 && !c1 && (c6 || c7)) {
      cerrarEntidad();
      continue;
    }

    // Fila de encabezado de entidad: RUT + Nombre.
    if (c0 && c1) {
      cerrarEntidad();
      entidadRut = c0;
      entidadNombre = c1;
      continue;
    }
  }

  const totalSaldo = facturas.reduce((suma, f) => suma + f.saldo, 0);

  if (!cuentaCodigo) {
    throw new Error('No se encontró la cuenta del reporte (fila "CUENTA" en la sección de datos del informe).');
  }

  return { cuentaCodigo, cuentaNombre, facturas, totalDebito, totalCredito, totalSaldo };
}
