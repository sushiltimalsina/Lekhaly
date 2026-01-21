-- AlterTable
ALTER TABLE "BankStatement" ADD COLUMN     "periodFromBs" TEXT,
ADD COLUMN     "periodToBs" TEXT;

-- AlterTable
ALTER TABLE "BankStatementLine" ADD COLUMN     "dateBs" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "dateBs" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "dateBs" TEXT,
ADD COLUMN     "dueDateBs" TEXT;

-- AlterTable
ALTER TABLE "StockLedger" ADD COLUMN     "dateBs" TEXT;

-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "voucherDateBs" TEXT;
