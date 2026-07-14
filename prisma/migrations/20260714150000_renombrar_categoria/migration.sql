-- Renombra Cuenta.seccionPL a Cuenta.categoria y migra el valor "NONE" a "SIN_CLASIFICAR".
ALTER TABLE "Cuenta" RENAME COLUMN "seccionPL" TO "categoria";
ALTER TABLE "Cuenta" ALTER COLUMN "categoria" SET DEFAULT 'SIN_CLASIFICAR';
UPDATE "Cuenta" SET "categoria" = 'SIN_CLASIFICAR' WHERE "categoria" = 'NONE';
