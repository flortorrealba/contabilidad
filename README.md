# Cierre Contable

Aplicación web para subir el Mayor de un cierre contable (libro diario o Libro
Mayor, en Excel o CSV), validar que cuadre (Debe = Haber) y contrastarlo contra
el Balance y los Auxiliares de clientes y proveedores que exporta el sistema
contable, para detectar diferencias cuenta por cuenta y documento por
documento. De paso, también genera el Balance de Comprobación y el Estado de
Resultados (P&L) por periodo. Soporta múltiples empresas y usuarios, y guarda
cada cierre subido.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- Autenticación propia (email/contraseña, sesión por cookie firmada con `jose`)
- Parseo de Excel/CSV con `xlsx` (SheetJS)

## Desplegar en Vercel (sin usar la terminal)

1. Entra a [vercel.com](https://vercel.com) y crea una cuenta gratis iniciando
   sesión con tu cuenta de GitHub (la misma dueña de este repositorio).
2. Click en **Add New → Project** e importa este repositorio
   (`flortorrealba/contabilidad`), seleccionando la rama
   `claude/accounting-pl-statement-f66uo9`.
3. Antes de desplegar, ve a la pestaña **Storage** del proyecto y crea una
   base de datos **Postgres** gratuita (Neon/Vercel Postgres). Al conectarla
   al proyecto, Vercel agrega automáticamente la variable `DATABASE_URL`.
   - Si no aparece esa opción durante la importación, primero completa el
     despliegue (puede fallar la primera vez), luego crea la base de datos
     desde **Storage → Create Database → Postgres**, conéctala al proyecto, y
     finalmente usa el botón **Redeploy**.
4. En **Settings → Environment Variables**, agrega una variable llamada
   `AUTH_SECRET` con cualquier texto largo y aleatorio (por ejemplo, generado
   en [randomkeygen.com](https://randomkeygen.com)).
5. Click en **Deploy**. Cuando termine, Vercel te da una URL
   (`https://tu-proyecto.vercel.app`) — esa es tu app, ya lista para usar
   desde cualquier navegador, sin instalar nada.

## Correrla en tu computador (alternativa con terminal)

```bash
npm install
cp .env.example .env   # reemplaza DATABASE_URL por tu Postgres y AUTH_SECRET por un valor aleatorio
npx prisma migrate deploy
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), crea una cuenta, crea una
empresa y sube el libro diario (columnas mínimas: Fecha, Cuenta, Debe, Haber)
o el Libro Mayor Tributario Jornalizador que exporta iContador (hoja
"Mayores" con los movimientos agrupados por cuenta). Necesitas una base de
datos PostgreSQL accesible (local o gratuita en [neon.tech](https://neon.tech),
por ejemplo).

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
