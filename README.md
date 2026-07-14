# Contabilidad — Libro Diario → Estado de Resultados

Aplicación web para subir un libro diario contable (Excel o CSV), validar que la
contabilidad cuadre (Debe = Haber) y generar automáticamente el Balance de
Comprobación y el Estado de Resultados (P&L) por periodo. Soporta múltiples
empresas y usuarios, y guarda cada cierre subido.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- Autenticación propia (email/contraseña, sesión por cookie firmada con `jose`)
- Parseo de Excel/CSV con `xlsx` (SheetJS)

## Primeros pasos

```bash
npm install
cp .env.example .env   # y reemplaza AUTH_SECRET por un valor aleatorio propio
npx prisma migrate deploy
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), crea una cuenta, crea una
empresa y sube el libro diario (columnas mínimas: Fecha, Cuenta, Debe, Haber).

## Cómo funciona

1. **Empresas**: cada usuario puede crear o unirse a una o más empresas.
2. **Plan de cuentas**: al subir un libro diario, las cuentas nuevas se crean
   automáticamente y se les sugiere una sección del Estado de Resultados según
   su nombre (`src/lib/clasificacion-default.ts`). Se pueden reclasificar
   manualmente en "Plan de cuentas".
3. **Cierres**: cada archivo subido genera un cierre guardado con sus propios
   asientos, permitiendo mantener un historial por periodo.
4. **Balance de Comprobación**: suma Debe/Haber por cuenta y valida que el
   total cuadre.
5. **Estado de Resultados**: agrupa las cuentas de resultado por sección
   (Ingresos, Costo de Ventas, Gastos de Administración y Ventas, Costos
   Financieros, Otras Ganancias/Pérdidas, Impuesto a las Ganancias) con
   columnas mensuales y acumulado, calculando Margen Bruto, EBITDA y
   Resultado antes de Impuestos.

## Comandos útiles

```bash
npm run dev       # entorno de desarrollo
npm run build     # build de producción
npm run lint      # eslint
npx prisma studio # explorar la base de datos
```
