ALTER TABLE "Company"
  ADD COLUMN "ownerName" TEXT,
  ADD COLUMN "panVatNumber" TEXT,
  ADD COLUMN "companyRegistrationNumber" TEXT,
  ADD COLUMN "localRegistrationNumber" TEXT,
  ADD COLUMN "dftqcNumber" TEXT,
  ADD COLUMN "tole" TEXT,
  ADD COLUMN "province" TEXT,
  ADD COLUMN "district" TEXT,
  ADD COLUMN "localLevel" TEXT,
  ADD COLUMN "ward" INTEGER;

UPDATE "Company"
SET "panVatNumber" = COALESCE("panNumber", "vatNumber")
WHERE "panVatNumber" IS NULL;
