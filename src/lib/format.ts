const formatoMoneda = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatearMonto(valor: number) {
  return formatoMoneda.format(Math.round(valor));
}

const formatoFecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "UTC" });

export function formatearFecha(fecha: Date) {
  return formatoFecha.format(fecha);
}

export const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
