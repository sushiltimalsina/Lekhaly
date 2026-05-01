-- CreateTable
CREATE TABLE "ApiIdempotency" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "requestHash" TEXT,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiIdempotency_companyId_createdAt_idx" ON "ApiIdempotency"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiIdempotency_companyId_key_action_key" ON "ApiIdempotency"("companyId", "key", "action");

-- AddForeignKey
ALTER TABLE "ApiIdempotency" ADD CONSTRAINT "ApiIdempotency_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiIdempotency" ADD CONSTRAINT "ApiIdempotency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
