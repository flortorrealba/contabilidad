ALTER TABLE "Asiento" ADD COLUMN "codigoAnalisis" TEXT;
CREATE INDEX "Asiento_cuentaId_codigoAnalisis_idx" ON "Asiento"("cuentaId", "codigoAnalisis");
