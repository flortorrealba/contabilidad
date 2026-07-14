// Categorías de clasificación de cuentas: cubren tanto el Estado de Situación
// Financiera Clasificado (Balance) como el Estado de Resultados (P&L).
// Cada categoría pertenece a un único "grupo" que determina dónde aparece y,
// para las cuentas de balance, la convención de signo a usar.

export const GRUPOS = [
  "ACTIVO_CORRIENTE",
  "ACTIVO_NO_CORRIENTE",
  "PASIVO_CORRIENTE",
  "PASIVO_NO_CORRIENTE",
  "PATRIMONIO",
  "RESULTADO",
] as const;

export type Grupo = (typeof GRUPOS)[number];

export const GRUPO_LABEL: Record<Grupo, string> = {
  ACTIVO_CORRIENTE: "Activos corrientes",
  ACTIVO_NO_CORRIENTE: "Activos no corrientes",
  PASIVO_CORRIENTE: "Pasivos corrientes",
  PASIVO_NO_CORRIENTE: "Pasivos no corrientes",
  PATRIMONIO: "Patrimonio",
  RESULTADO: "Estado de Resultados",
};

// Grupos de Activo usan convención débito (debe - haber); todo lo demás
// (Pasivo, Patrimonio, Resultado) usa convención crédito (haber - debe).
export function esGrupoActivo(grupo: Grupo) {
  return grupo === "ACTIVO_CORRIENTE" || grupo === "ACTIVO_NO_CORRIENTE";
}

export const CATEGORIAS_BALANCE = [
  "EFECTIVO_EQUIVALENTE",
  "OTROS_ACTIVOS_NO_FINANCIEROS_CORRIENTES",
  "ACTIVOS_POR_IMPUESTOS_CORRIENTES",
  "DEUDORES_COMERCIALES",
  "CUENTAS_POR_COBRAR_RELACIONADAS",
  "INVENTARIOS_CORRIENTES",
  "PROPIEDADES_PLANTA_EQUIPO",
  "OTROS_ACTIVOS_NO_CORRIENTES",
  "OTROS_PASIVOS_FINANCIEROS_CORRIENTES",
  "CUENTAS_POR_PAGAR_RELACIONADAS",
  "OTROS_PASIVOS_NO_FINANCIEROS_CORRIENTES",
  "PASIVOS_NO_CORRIENTES",
  "CAPITAL_EMITIDO",
  "GANANCIAS_PERDIDAS_ACUMULADAS",
] as const;

export const CATEGORIAS_RESULTADO = [
  "INGRESOS",
  "COSTO_VENTAS",
  "GASTOS_ADMIN_VENTAS",
  "COSTOS_FINANCIEROS",
  "OTRAS_GANANCIAS_PERDIDAS",
  "IMPUESTO_GANANCIAS",
] as const;

export const CATEGORIAS = [...CATEGORIAS_BALANCE, ...CATEGORIAS_RESULTADO] as const;

export type Categoria = "SIN_CLASIFICAR" | (typeof CATEGORIAS)[number];

interface CategoriaMeta {
  label: string;
  grupo: Grupo;
}

export const CATEGORIA_META: Record<Categoria, CategoriaMeta> = {
  SIN_CLASIFICAR: { label: "Sin clasificar", grupo: "RESULTADO" },

  EFECTIVO_EQUIVALENTE: { label: "Efectivo y efectivo equivalente", grupo: "ACTIVO_CORRIENTE" },
  OTROS_ACTIVOS_NO_FINANCIEROS_CORRIENTES: {
    label: "Otros activos no financieros corrientes",
    grupo: "ACTIVO_CORRIENTE",
  },
  ACTIVOS_POR_IMPUESTOS_CORRIENTES: { label: "Activos por impuestos corrientes", grupo: "ACTIVO_CORRIENTE" },
  DEUDORES_COMERCIALES: {
    label: "Deudores comerciales y otras cuentas por cobrar, corrientes",
    grupo: "ACTIVO_CORRIENTE",
  },
  CUENTAS_POR_COBRAR_RELACIONADAS: {
    label: "Cuentas por cobrar a entidades relacionadas, corrientes",
    grupo: "ACTIVO_CORRIENTE",
  },
  INVENTARIOS_CORRIENTES: { label: "Inventarios corrientes", grupo: "ACTIVO_CORRIENTE" },

  PROPIEDADES_PLANTA_EQUIPO: { label: "Propiedades, planta y equipo", grupo: "ACTIVO_NO_CORRIENTE" },
  OTROS_ACTIVOS_NO_CORRIENTES: { label: "Otros activos no corrientes", grupo: "ACTIVO_NO_CORRIENTE" },

  OTROS_PASIVOS_FINANCIEROS_CORRIENTES: {
    label: "Otros pasivos financieros corrientes",
    grupo: "PASIVO_CORRIENTE",
  },
  CUENTAS_POR_PAGAR_RELACIONADAS: {
    label: "Cuentas por pagar a entidades relacionadas",
    grupo: "PASIVO_CORRIENTE",
  },
  OTROS_PASIVOS_NO_FINANCIEROS_CORRIENTES: {
    label: "Otros pasivos no financieros, corrientes",
    grupo: "PASIVO_CORRIENTE",
  },

  PASIVOS_NO_CORRIENTES: { label: "Pasivos no corrientes", grupo: "PASIVO_NO_CORRIENTE" },

  CAPITAL_EMITIDO: { label: "Capital emitido", grupo: "PATRIMONIO" },
  GANANCIAS_PERDIDAS_ACUMULADAS: { label: "Ganancias (pérdidas) acumuladas", grupo: "PATRIMONIO" },

  INGRESOS: { label: "Ingresos por actividades ordinarias", grupo: "RESULTADO" },
  COSTO_VENTAS: { label: "Costo de ventas", grupo: "RESULTADO" },
  GASTOS_ADMIN_VENTAS: { label: "Gastos de administración y ventas", grupo: "RESULTADO" },
  COSTOS_FINANCIEROS: { label: "Costos financieros", grupo: "RESULTADO" },
  OTRAS_GANANCIAS_PERDIDAS: { label: "Otras ganancias (pérdidas)", grupo: "RESULTADO" },
  IMPUESTO_GANANCIAS: { label: "Impuesto a las ganancias", grupo: "RESULTADO" },
};

// Las categorías de Resultado son, a la vez, las "secciones" del Estado de Resultados.
export type SeccionPL = (typeof CATEGORIAS_RESULTADO)[number];

export function isCategoria(value: string): value is Categoria {
  return value === "SIN_CLASIFICAR" || (CATEGORIAS as readonly string[]).includes(value);
}

export function esCategoriaResultado(categoria: Categoria): categoria is SeccionPL {
  return (CATEGORIAS_RESULTADO as readonly string[]).includes(categoria);
}

export function esCategoriaBalance(categoria: Categoria): boolean {
  return (CATEGORIAS_BALANCE as readonly string[]).includes(categoria);
}
