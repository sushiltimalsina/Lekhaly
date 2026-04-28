/*
  Warnings:

  - A unique constraint covering the columns `[companyId,name]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('goods', 'services');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('draft', 'open', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'open', 'received', 'cancelled');

-- AlterEnum
ALTER TYPE "VoucherStatus" ADD VALUE 'pending_post';

-- AlterEnum
ALTER TYPE "VoucherType" ADD VALUE 'contra';

-- AlterTable
ALTER TABLE "ChartOfAccount" ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "activeFiscalSessionId" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "contraPrefix" TEXT NOT NULL DEFAULT 'CV',
ADD COLUMN     "contraSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "creditLimitAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "invoiceSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "journalPrefix" TEXT NOT NULL DEFAULT 'JV',
ADD COLUMN     "journalSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "nextContraNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextJournalNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextOrderNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextPaymentNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextPurchaseNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextPurchaseOrderNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextPurchaseReturnNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextQuotationNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextReceiptNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextSalesReturnNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "orderPrefix" TEXT NOT NULL DEFAULT 'SO',
ADD COLUMN     "orderSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "paymentPrefix" TEXT NOT NULL DEFAULT 'PV',
ADD COLUMN     "paymentSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "printLogo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "purchaseOrderPrefix" TEXT NOT NULL DEFAULT 'PO',
ADD COLUMN     "purchaseOrderSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "purchasePrefix" TEXT NOT NULL DEFAULT 'PURI',
ADD COLUMN     "purchaseReturnPrefix" TEXT NOT NULL DEFAULT 'PR',
ADD COLUMN     "purchaseReturnSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "purchaseSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "quotationPrefix" TEXT NOT NULL DEFAULT 'QT',
ADD COLUMN     "quotationSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "receiptPrefix" TEXT NOT NULL DEFAULT 'RV',
ADD COLUMN     "receiptSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "salesReturnPrefix" TEXT NOT NULL DEFAULT 'SR',
ADD COLUMN     "salesReturnSuffix" TEXT NOT NULL DEFAULT '80/81',
ADD COLUMN     "vatNumber" TEXT,
ALTER COLUMN "invoicePrefix" SET DEFAULT 'SI';

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "proformaPrefix" TEXT,
ADD COLUMN     "proformaSequence" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "additionalNote" TEXT,
ADD COLUMN     "memo" TEXT,
ADD COLUMN     "referenceNo" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "hsCode" TEXT,
ADD COLUMN     "type" "ItemType" NOT NULL DEFAULT 'goods';

-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "additionalNote" TEXT,
ADD COLUMN     "fiscalSessionId" TEXT,
ADD COLUMN     "referenceNo" TEXT,
ADD COLUMN     "vendorInvoiceDate" TIMESTAMP(3),
ADD COLUMN     "vendorInvoiceNo" TEXT;

-- AlterTable
ALTER TABLE "VoucherLine" ADD COLUMN     "qty" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BillSundry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'add',
    "rate" DECIMAL(10,2),
    "accountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillSundry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemGroup" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTaxCode" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "taxCodeId" TEXT NOT NULL,

    CONSTRAINT "ItemTaxCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItemTax" (
    "id" TEXT NOT NULL,
    "invoiceItemId" TEXT NOT NULL,
    "taxCodeId" TEXT NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "InvoiceItemTax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSundry" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "billSundryId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rate" DECIMAL(10,2),
    "amount" DECIMAL(14,2) NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceSundry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaInvoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "localNumber" TEXT NOT NULL,
    "voucherId" TEXT,
    "voucherType" "VoucherType" NOT NULL,
    "payload" JSONB NOT NULL,
    "memo" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProformaInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "quotationNo" TEXT,
    "referenceNo" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
    "partyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateBs" TEXT,
    "expiryDate" TIMESTAMP(3),
    "expiryDateBs" TEXT,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "vatAmount" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "memo" TEXT,
    "additionalNote" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "itemId" TEXT,
    "description" TEXT,
    "qty" DECIMAL(14,2) NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "taxCodeId" TEXT,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationSundry" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "billSundryId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rate" DECIMAL(10,2),
    "amount" DECIMAL(14,2) NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationSundry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderNo" TEXT,
    "customerPoRef" TEXT,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'draft',
    "partyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateBs" TEXT,
    "expectedDelivery" TIMESTAMP(3),
    "expectedDeliveryBs" TEXT,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "vatAmount" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "memo" TEXT,
    "additionalNote" TEXT,
    "terms" TEXT,
    "quotationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT,
    "description" TEXT,
    "qty" DECIMAL(14,2) NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "fulfilledQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxCodeId" TEXT,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderSundry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "billSundryId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rate" DECIMAL(10,2),
    "amount" DECIMAL(14,2) NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesOrderSundry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderNo" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
    "partyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateBs" TEXT,
    "expectedDelivery" TIMESTAMP(3),
    "expectedDeliveryBs" TEXT,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "vatAmount" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "memo" TEXT,
    "additionalNote" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT,
    "description" TEXT,
    "qty" DECIMAL(14,2) NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "receivedQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxCodeId" TEXT,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderSundry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "billSundryId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rate" DECIMAL(10,2),
    "amount" DECIMAL(14,2) NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderSundry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalSession" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'SI',
    "purchasePrefix" TEXT NOT NULL DEFAULT 'PURI',
    "salesReturnPrefix" TEXT NOT NULL DEFAULT 'SR',
    "purchaseReturnPrefix" TEXT NOT NULL DEFAULT 'PR',
    "orderPrefix" TEXT NOT NULL DEFAULT 'SO',
    "quotationPrefix" TEXT NOT NULL DEFAULT 'QT',
    "purchaseOrderPrefix" TEXT NOT NULL DEFAULT 'PO',
    "receiptPrefix" TEXT NOT NULL DEFAULT 'RV',
    "paymentPrefix" TEXT NOT NULL DEFAULT 'PV',
    "journalPrefix" TEXT NOT NULL DEFAULT 'JV',
    "contraPrefix" TEXT NOT NULL DEFAULT 'CV',
    "invoiceSuffix" TEXT NOT NULL DEFAULT '80/81',
    "purchaseSuffix" TEXT NOT NULL DEFAULT '80/81',
    "salesReturnSuffix" TEXT NOT NULL DEFAULT '80/81',
    "purchaseReturnSuffix" TEXT NOT NULL DEFAULT '80/81',
    "orderSuffix" TEXT NOT NULL DEFAULT '80/81',
    "quotationSuffix" TEXT NOT NULL DEFAULT '80/81',
    "purchaseOrderSuffix" TEXT NOT NULL DEFAULT '80/81',
    "receiptSuffix" TEXT NOT NULL DEFAULT '80/81',
    "paymentSuffix" TEXT NOT NULL DEFAULT '80/81',
    "journalSuffix" TEXT NOT NULL DEFAULT '80/81',
    "contraSuffix" TEXT NOT NULL DEFAULT '80/81',
    "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1,
    "nextPurchaseNumber" INTEGER NOT NULL DEFAULT 1,
    "nextSalesReturnNumber" INTEGER NOT NULL DEFAULT 1,
    "nextPurchaseReturnNumber" INTEGER NOT NULL DEFAULT 1,
    "nextOrderNumber" INTEGER NOT NULL DEFAULT 1,
    "nextQuotationNumber" INTEGER NOT NULL DEFAULT 1,
    "nextPurchaseOrderNumber" INTEGER NOT NULL DEFAULT 1,
    "nextReceiptNumber" INTEGER NOT NULL DEFAULT 1,
    "nextPaymentNumber" INTEGER NOT NULL DEFAULT 1,
    "nextJournalNumber" INTEGER NOT NULL DEFAULT 1,
    "nextContraNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillSundry_companyId_isActive_idx" ON "BillSundry"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BillSundry_companyId_name_key" ON "BillSundry"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_companyId_name_key" ON "Unit"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemGroup_companyId_name_key" ON "ItemGroup"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemTaxCode_itemId_taxCodeId_key" ON "ItemTaxCode"("itemId", "taxCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceItemTax_invoiceItemId_taxCodeId_key" ON "InvoiceItemTax"("invoiceItemId", "taxCodeId");

-- CreateIndex
CREATE INDEX "ProformaInvoice_companyId_convertedAt_idx" ON "ProformaInvoice"("companyId", "convertedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProformaInvoice_companyId_localNumber_key" ON "ProformaInvoice"("companyId", "localNumber");

-- CreateIndex
CREATE INDEX "Quotation_companyId_date_idx" ON "Quotation"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_companyId_quotationNo_key" ON "Quotation"("companyId", "quotationNo");

-- CreateIndex
CREATE INDEX "SalesOrder_companyId_date_idx" ON "SalesOrder"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_companyId_orderNo_key" ON "SalesOrder"("companyId", "orderNo");

-- CreateIndex
CREATE INDEX "PurchaseOrder_companyId_date_idx" ON "PurchaseOrder"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_companyId_orderNo_key" ON "PurchaseOrder"("companyId", "orderNo");

-- CreateIndex
CREATE INDEX "FiscalSession_companyId_isLocked_idx" ON "FiscalSession"("companyId", "isLocked");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalSession_companyId_name_key" ON "FiscalSession"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Item_companyId_name_key" ON "Item"("companyId", "name");

-- AddForeignKey
ALTER TABLE "BillSundry" ADD CONSTRAINT "BillSundry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillSundry" ADD CONSTRAINT "BillSundry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemGroup" ADD CONSTRAINT "ItemGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTaxCode" ADD CONSTRAINT "ItemTaxCode_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTaxCode" ADD CONSTRAINT "ItemTaxCode_taxCodeId_fkey" FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_fiscalSessionId_fkey" FOREIGN KEY ("fiscalSessionId") REFERENCES "FiscalSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItemTax" ADD CONSTRAINT "InvoiceItemTax_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "InvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItemTax" ADD CONSTRAINT "InvoiceItemTax_taxCodeId_fkey" FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSundry" ADD CONSTRAINT "InvoiceSundry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSundry" ADD CONSTRAINT "InvoiceSundry_billSundryId_fkey" FOREIGN KEY ("billSundryId") REFERENCES "BillSundry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSundry" ADD CONSTRAINT "InvoiceSundry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_taxCodeId_fkey" FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationSundry" ADD CONSTRAINT "QuotationSundry_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationSundry" ADD CONSTRAINT "QuotationSundry_billSundryId_fkey" FOREIGN KEY ("billSundryId") REFERENCES "BillSundry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationSundry" ADD CONSTRAINT "QuotationSundry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_taxCodeId_fkey" FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderSundry" ADD CONSTRAINT "SalesOrderSundry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderSundry" ADD CONSTRAINT "SalesOrderSundry_billSundryId_fkey" FOREIGN KEY ("billSundryId") REFERENCES "BillSundry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderSundry" ADD CONSTRAINT "SalesOrderSundry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_taxCodeId_fkey" FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderSundry" ADD CONSTRAINT "PurchaseOrderSundry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderSundry" ADD CONSTRAINT "PurchaseOrderSundry_billSundryId_fkey" FOREIGN KEY ("billSundryId") REFERENCES "BillSundry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderSundry" ADD CONSTRAINT "PurchaseOrderSundry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalSession" ADD CONSTRAINT "FiscalSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
