CREATE TABLE "ValidacionExterna" (
    "id" TEXT NOT NULL,
    "cierreId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "archivoOrigen" TEXT,
    "cuentaCodigo" TEXT,
    "cuentaNombre" TEXT,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidacionExterna_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ValidacionExterna_cierreId_idx" ON "ValidacionExterna"("cierreId");

ALTER TABLE "ValidacionExterna" ADD CONSTRAINT "ValidacionExterna_cierreId_fkey" FOREIGN KEY ("cierreId") REFERENCES "Cierre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
