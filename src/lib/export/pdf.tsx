import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type {
  BalanceComprobacion,
  CategoriaEFF,
  EstadoResultados,
  EstadoSituacionFinanciera,
  GrupoEFF,
  SeccionResultados,
} from "@/lib/reportes";
import { formatearMonto, NOMBRES_MESES } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 8, fontFamily: "Helvetica" },
  titulo: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  subtitulo: { fontSize: 9, color: "#555", marginBottom: 12 },
  seccionTitulo: { fontSize: 11, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd", paddingVertical: 2 },
  headerRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000", paddingVertical: 3 },
  totalRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#000", paddingVertical: 3 },
  bold: { fontWeight: 700 },
  cellLabel: { width: 170, flexShrink: 0, paddingRight: 4 },
  cellNum: { width: 60, textAlign: "right" },
});

// Ancho usado por la página landscape A4 (841pt) menos márgenes (24pt c/u).
const ANCHO_DISPONIBLE = 793;
const ANCHO_ETIQUETA = 170;
const ANCHO_ACUMULADO = 65;

function calcularAnchoMes(cantidadMeses: number) {
  const disponible = ANCHO_DISPONIBLE - ANCHO_ETIQUETA - ANCHO_ACUMULADO;
  const ancho = cantidadMeses > 0 ? disponible / cantidadMeses : disponible;
  return Math.max(38, Math.min(70, ancho));
}

function EstadoResultadosPdf({
  estado,
  nombreEmpresa,
  nombreCierre,
}: {
  estado: EstadoResultados;
  nombreEmpresa: string;
  nombreCierre: string;
}) {
  const anchoMes = calcularAnchoMes(estado.meses.length);
  const tamanoFuente = estado.meses.length > 8 ? 6.5 : 8;
  const numColMonto = { width: anchoMes, textAlign: "right" as const, fontSize: tamanoFuente };
  const numColAcum = { width: ANCHO_ACUMULADO, textAlign: "right" as const, fontSize: tamanoFuente };

  const filaSeccion = (seccion: SeccionResultados) => {
    if (seccion.lineas.length === 0) return null;
    return (
      <View key={seccion.seccion}>
        <View style={[styles.row, { backgroundColor: "#f3f3f3" }]}>
          <Text style={[styles.cellLabel, styles.bold]}>{seccion.label}</Text>
          {seccion.montosPorMes.map((m, i) => (
            <Text key={i} style={[numColMonto, styles.bold]}>
              {formatearMonto(m)}
            </Text>
          ))}
          <Text style={[numColAcum, styles.bold]}>{formatearMonto(seccion.total)}</Text>
        </View>
        {seccion.lineas.map((linea) => (
          <View style={styles.row} key={linea.cuentaId}>
            <Text style={[styles.cellLabel, { paddingLeft: 10 }]}>{linea.nombre}</Text>
            {linea.montosPorMes.map((m, i) => (
              <Text key={i} style={numColMonto}>
                {formatearMonto(m)}
              </Text>
            ))}
            <Text style={numColAcum}>{formatearMonto(linea.total)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const filaSubtotal = (label: string, montosPorMes: number[], total: number) => (
    <View style={[styles.totalRow, { backgroundColor: "#e5e5e5" }]}>
      <Text style={[styles.cellLabel, styles.bold]}>{label}</Text>
      {montosPorMes.map((m, i) => (
        <Text key={i} style={[numColMonto, styles.bold]}>
          {formatearMonto(m)}
        </Text>
      ))}
      <Text style={[numColAcum, styles.bold]}>{formatearMonto(total)}</Text>
    </View>
  );

  const [ingresos, costoVentas, gastosAdmin, costosFinancieros, otrasGanancias, impuesto] = estado.secciones;

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.titulo}>{nombreEmpresa}</Text>
      <Text style={styles.subtitulo}>{nombreCierre}</Text>
      <Text style={styles.seccionTitulo}>Estado de Resultados</Text>
      <View style={styles.headerRow}>
        <Text style={styles.cellLabel}></Text>
        {estado.meses.map((mes) => (
          <Text key={mes} style={numColMonto}>
            {NOMBRES_MESES[mes - 1]}
          </Text>
        ))}
        <Text style={numColAcum}>Acumulado</Text>
      </View>
      {filaSeccion(ingresos)}
      {filaSeccion(costoVentas)}
      {filaSubtotal("MARGEN BRUTO", estado.margenBruto.montosPorMes, estado.margenBruto.total)}
      {filaSeccion(gastosAdmin)}
      {filaSubtotal("EBITDA", estado.ebitda.montosPorMes, estado.ebitda.total)}
      {filaSeccion(costosFinancieros)}
      {filaSeccion(otrasGanancias)}
      {filaSeccion(impuesto)}
      {filaSubtotal(
        "RESULTADO ANTES DE IMPUESTOS",
        estado.resultadoAntesImpuestos.montosPorMes,
        estado.resultadoAntesImpuestos.total
      )}
    </Page>
  );
}

function BalanceComprobacionPdf({ balance }: { balance: BalanceComprobacion }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.seccionTitulo}>Balance de Comprobación</Text>
      <Text style={{ marginBottom: 8, color: balance.cuadra ? "#15803d" : "#b91c1c" }}>
        {balance.cuadra ? "La contabilidad cuadra (Debe = Haber)." : "La contabilidad NO cuadra."}
      </Text>
      <View style={styles.headerRow}>
        <Text style={{ width: 40 }}>Código</Text>
        <Text style={styles.cellLabel}>Cuenta</Text>
        <Text style={styles.cellNum}>Debe</Text>
        <Text style={styles.cellNum}>Haber</Text>
        <Text style={styles.cellNum}>Saldo Deudor</Text>
        <Text style={styles.cellNum}>Saldo Acreedor</Text>
      </View>
      {balance.filas.map((f) => (
        <View style={styles.row} key={f.cuentaId}>
          <Text style={{ width: 40 }}>{f.codigo ?? ""}</Text>
          <Text style={styles.cellLabel}>{f.nombre}</Text>
          <Text style={styles.cellNum}>{formatearMonto(f.debe)}</Text>
          <Text style={styles.cellNum}>{formatearMonto(f.haber)}</Text>
          <Text style={styles.cellNum}>{f.saldoDeudor ? formatearMonto(f.saldoDeudor) : "-"}</Text>
          <Text style={styles.cellNum}>{f.saldoAcreedor ? formatearMonto(f.saldoAcreedor) : "-"}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={{ width: 40 }}></Text>
        <Text style={[styles.cellLabel, styles.bold]}>Totales</Text>
        <Text style={[styles.cellNum, styles.bold]}>{formatearMonto(balance.totalDebe)}</Text>
        <Text style={[styles.cellNum, styles.bold]}>{formatearMonto(balance.totalHaber)}</Text>
        <Text style={[styles.cellNum, styles.bold]}>{formatearMonto(balance.totalSaldoDeudor)}</Text>
        <Text style={[styles.cellNum, styles.bold]}>{formatearMonto(balance.totalSaldoAcreedor)}</Text>
      </View>
    </Page>
  );
}

function FilaCategoriaEFF({ categoria }: { categoria: CategoriaEFF }) {
  return (
    <View key={categoria.categoria}>
      <View style={[styles.row, { backgroundColor: "#f3f3f3" }]}>
        <Text style={[styles.cellLabel, styles.bold, { width: 280 }]}>{categoria.label}</Text>
        <Text style={[styles.cellNum, styles.bold]}>{formatearMonto(categoria.total)}</Text>
      </View>
      {categoria.lineas.map((linea) => (
        <View style={styles.row} key={linea.cuentaId}>
          <Text style={[styles.cellLabel, { width: 280, paddingLeft: 10 }]}>{linea.nombre}</Text>
          <Text style={styles.cellNum}>{formatearMonto(linea.monto)}</Text>
        </View>
      ))}
    </View>
  );
}

function GrupoEFFView({ grupo }: { grupo: GrupoEFF }) {
  if (grupo.categorias.length === 0) return null;
  return (
    <View>
      <View style={[styles.totalRow, { backgroundColor: "#e5e5e5" }]}>
        <Text style={[styles.cellLabel, styles.bold, { width: 280 }]}>{grupo.label}</Text>
        <Text style={[styles.cellNum, styles.bold]}>{formatearMonto(grupo.total)}</Text>
      </View>
      {grupo.categorias.map((c) => (
        <FilaCategoriaEFF key={c.categoria} categoria={c} />
      ))}
    </View>
  );
}

function EstadoSituacionFinancieraPdf({ eff }: { eff: EstadoSituacionFinanciera }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.seccionTitulo}>Estado de Situación Financiera Clasificado</Text>
      <Text style={{ marginBottom: 8, color: eff.cuadra ? "#15803d" : "#b91c1c" }}>
        {eff.cuadra
          ? "El balance cuadra: Total Activos = Total Patrimonio y Pasivos."
          : `El balance NO cuadra. Diferencia de ${formatearMonto(Math.abs(eff.diferencia))}.`}
      </Text>

      <Text style={[styles.bold, { fontSize: 10, marginTop: 8, marginBottom: 4 }]}>ACTIVOS</Text>
      <GrupoEFFView grupo={eff.activoCorriente} />
      <GrupoEFFView grupo={eff.activoNoCorriente} />
      <View style={[styles.totalRow, { borderTopWidth: 1.5 }]}>
        <Text style={[styles.cellLabel, styles.bold, { width: 280 }]}>TOTAL ACTIVOS</Text>
        <Text style={[styles.cellNum, styles.bold]}>{formatearMonto(eff.totalActivos)}</Text>
      </View>

      <Text style={[styles.bold, { fontSize: 10, marginTop: 14, marginBottom: 4 }]}>PATRIMONIO Y PASIVOS</Text>
      <GrupoEFFView grupo={eff.pasivoCorriente} />
      <GrupoEFFView grupo={eff.pasivoNoCorriente} />
      <GrupoEFFView grupo={eff.patrimonio} />
      <View style={[styles.totalRow, { borderTopWidth: 1.5 }]}>
        <Text style={[styles.cellLabel, styles.bold, { width: 280 }]}>TOTAL PATRIMONIO Y PASIVOS</Text>
        <Text style={[styles.cellNum, styles.bold]}>{formatearMonto(eff.totalPatrimonioYPasivos)}</Text>
      </View>
    </Page>
  );
}

export async function generarPdfCierre(
  nombreEmpresa: string,
  nombreCierre: string,
  balance: BalanceComprobacion,
  estado: EstadoResultados,
  eff: EstadoSituacionFinanciera
): Promise<Buffer> {
  const documento = (
    <Document>
      <EstadoResultadosPdf estado={estado} nombreEmpresa={nombreEmpresa} nombreCierre={nombreCierre} />
      <EstadoSituacionFinancieraPdf eff={eff} />
      <BalanceComprobacionPdf balance={balance} />
    </Document>
  );

  return renderToBuffer(documento);
}
