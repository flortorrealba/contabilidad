-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmpresaMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmpresaMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmpresaMember_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "seccionPL" TEXT NOT NULL DEFAULT 'NONE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cuenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cierre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaDesde" DATETIME NOT NULL,
    "fechaHasta" DATETIME NOT NULL,
    "archivoOrigen" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "cuadra" BOOLEAN NOT NULL DEFAULT false,
    "totalDebe" REAL NOT NULL DEFAULT 0,
    "totalHaber" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPorId" TEXT,
    CONSTRAINT "Cierre_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Cierre_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cierreId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "mes" INTEGER NOT NULL,
    "tipo" TEXT,
    "numeroVoucher" TEXT,
    "numeroDocto" TEXT,
    "glosa" TEXT,
    "debe" REAL NOT NULL DEFAULT 0,
    "haber" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Asiento_cierreId_fkey" FOREIGN KEY ("cierreId") REFERENCES "Cierre" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmpresaMember_userId_empresaId_key" ON "EmpresaMember"("userId", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_empresaId_nombre_key" ON "Cuenta"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "Asiento_cierreId_idx" ON "Asiento"("cierreId");

-- CreateIndex
CREATE INDEX "Asiento_cuentaId_idx" ON "Asiento"("cuentaId");
