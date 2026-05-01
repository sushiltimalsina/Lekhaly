-- CreateTable
CREATE TABLE "VatRegisterLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "partyId" TEXT,
    "taxableAmount" DECIMAL(14,2) NOT NULL,
    "vatAmount" DECIMAL(14,2) NOT NULL,
    "type" TEXT NOT NULL,
    "taxCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VatRegisterLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VatRegisterLine_companyId_date_idx" ON "VatRegisterLine"("companyId", "date");

-- AddForeignKey
ALTER TABLE "VatRegisterLine" ADD CONSTRAINT "VatRegisterLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatRegisterLine" ADD CONSTRAINT "VatRegisterLine_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatRegisterLine" ADD CONSTRAINT "VatRegisterLine_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VatRegisterLine" ADD CONSTRAINT "VatRegisterLine_taxCodeId_fkey" FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
