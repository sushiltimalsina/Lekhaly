-- CreateEnum
CREATE TYPE "PdfJobStatus" AS ENUM ('pending', 'processing', 'done', 'failed');

-- CreateTable
CREATE TABLE "PdfJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "PdfJobStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "resultKey" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdfJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PdfJob_companyId_status_createdAt_idx" ON "PdfJob"("companyId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "PdfJob" ADD CONSTRAINT "PdfJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
