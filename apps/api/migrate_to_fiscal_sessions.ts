import { PrismaClient, VoucherType } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting Migration to Fiscal Sessions...");

    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies to migrate.`);

    for (const company of companies) {
        console.log(`Processing company: ${company.name} (${company.id})`);

        // Check if a session already exists
        const existingSessions = await prisma.fiscalSession.findMany({
            where: { companyId: company.id }
        });

        if (existingSessions.length > 0) {
            console.log(`  Skipping: Already has ${existingSessions.length} sessions.`);
            continue;
        }

        const sessionName = `FY ${company.invoiceSuffix || "Current"}`;
        
        // Use a wide default range for the first session to encompass all existing data
        // For Nepal, the current FY (as of mid-2024) is 80/81 which started mid-July 2023.
        const startDate = new Date("2020-01-01T00:00:00Z");
        const endDate = new Date("2026-12-31T23:59:59Z");

        await prisma.$transaction(async (tx) => {
            const session = await tx.fiscalSession.create({
                data: {
                    companyId: company.id,
                    name: sessionName,
                    startDate,
                    endDate,
                    isLocked: false,
                    
                    // Copy prefixes + suffixes
                    invoicePrefix: company.invoicePrefix,
                    purchasePrefix: company.purchasePrefix,
                    salesReturnPrefix: (company as any).salesReturnPrefix || "SR",
                    purchaseReturnPrefix: (company as any).purchaseReturnPrefix || "PR",
                    orderPrefix: (company as any).orderPrefix || "SO",
                    quotationPrefix: (company as any).quotationPrefix || "QT",
                    purchaseOrderPrefix: (company as any).purchaseOrderPrefix || "PO",
                    receiptPrefix: company.receiptPrefix,
                    paymentPrefix: company.paymentPrefix,
                    journalPrefix: company.journalPrefix,

                    invoiceSuffix: company.invoiceSuffix,
                    purchaseSuffix: company.purchaseSuffix,
                    salesReturnSuffix: (company as any).salesReturnSuffix || company.invoiceSuffix,
                    purchaseReturnSuffix: (company as any).purchaseReturnSuffix || company.invoiceSuffix,
                    orderSuffix: (company as any).orderSuffix || company.invoiceSuffix,
                    quotationSuffix: (company as any).quotationSuffix || company.invoiceSuffix,
                    purchaseOrderSuffix: (company as any).purchaseOrderSuffix || company.invoiceSuffix,
                    receiptSuffix: company.receiptSuffix,
                    paymentSuffix: company.paymentSuffix,
                    journalSuffix: company.journalSuffix,

                    // Copy counters
                    nextInvoiceNumber: company.nextInvoiceNumber,
                    nextPurchaseNumber: company.nextPurchaseNumber,
                    nextSalesReturnNumber: (company as any).nextSalesReturnNumber || 1,
                    nextPurchaseReturnNumber: (company as any).nextPurchaseReturnNumber || 1,
                    nextOrderNumber: (company as any).nextOrderNumber || 1,
                    nextQuotationNumber: (company as any).nextQuotationNumber || 1,
                    nextPurchaseOrderNumber: (company as any).nextPurchaseOrderNumber || 1,
                    nextReceiptNumber: company.nextReceiptNumber,
                    nextPaymentNumber: company.nextPaymentNumber,
                    nextJournalNumber: company.nextJournalNumber,
                }
            });

            // Set as active session
            await tx.company.update({
                where: { id: company.id },
                data: { activeFiscalSessionId: session.id }
            });

            // Link existing vouchers
            const updatedVouchers = await tx.voucher.updateMany({
                where: { companyId: company.id },
                data: { fiscalSessionId: session.id }
            });

            console.log(`  Migrated: Created session '${sessionName}' and linked ${updatedVouchers.count} vouchers.`);
        });
    }

    console.log("Migration complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
