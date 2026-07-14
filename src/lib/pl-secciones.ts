export const SECCIONES_PL = [
  "INGRESOS",
  "COSTO_VENTAS",
  "GASTOS_ADMIN_VENTAS",
  "COSTOS_FINANCIEROS",
  "OTRAS_GANANCIAS_PERDIDAS",
  "IMPUESTO_GANANCIAS",
] as const;

export type SeccionPL = "NONE" | (typeof SECCIONES_PL)[number];

export const SECCION_PL_LABEL: Record<SeccionPL, string> = {
  NONE: "Cuenta de balance (no aplica a Resultados)",
  INGRESOS: "Ingresos por actividades ordinarias",
  COSTO_VENTAS: "Costo de ventas",
  GASTOS_ADMIN_VENTAS: "Gastos de administración y ventas",
  COSTOS_FINANCIEROS: "Costos financieros",
  OTRAS_GANANCIAS_PERDIDAS: "Otras ganancias (pérdidas)",
  IMPUESTO_GANANCIAS: "Impuesto a las ganancias",
};

export function isSeccionPL(value: string): value is SeccionPL {
  return value === "NONE" || (SECCIONES_PL as readonly string[]).includes(value);
}
