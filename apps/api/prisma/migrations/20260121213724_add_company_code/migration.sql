-- add company code
ALTER TABLE "Company" ADD COLUMN "code" TEXT;
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");
