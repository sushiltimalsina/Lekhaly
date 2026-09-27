ALTER TABLE "FiscalSession"
  ADD COLUMN "lockChangedAt" TIMESTAMP(3),
  ADD COLUMN "lockChangedByUserId" TEXT,
  ADD COLUMN "lockReason" TEXT;
