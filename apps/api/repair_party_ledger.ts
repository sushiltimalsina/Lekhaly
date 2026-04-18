import { PrismaClient, VoucherType, CoaType } from "@prisma/client";
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
    console.log("Starting Party Ledger Data Repair...");

    // 1. Repair based on Invoices (Sales & Sales Returns)
    const invoices = await prisma.invoice.findMany({
        where: {
            voucherId: { not: null },
        },
        include: {
            party: true,
        }
    });

    console.log(`Found ${invoices.length} invoices to check.`);

    let invoiceCount = 0;
    for (const inv of invoices) {
        if (!inv.voucherId) continue;

        // Find the line that should have the partyId (the receivable account line)
        const updated = await prisma.voucherLine.updateMany({
            where: {
                voucherId: inv.voucherId,
                accountId: inv.receivableAccountId,
                partyId: null,
            },
            data: {
                partyId: inv.partyId,
            },
        });

        if (updated.count > 0) {
            invoiceCount += updated.count;
        }
    }
    console.log(`Repaired ${invoiceCount} voucher lines based on Invoices.`);

    // 2. Repair based on Expenses
    const expenses = await prisma.expense.findMany({
        where: {
            voucherId: { not: null },
            vendorId: { not: null },
        }
    });

    console.log(`Found ${expenses.length} expenses to check.`);
    let expenseCount = 0;
    for (const exp of expenses) {
        if (!exp.voucherId || !exp.vendorId) continue;

        // For expenses, we look for Liability lines (Accounts Payable)
        const updated = await prisma.voucherLine.updateMany({
            where: {
                voucherId: exp.voucherId,
                partyId: null,
                account: {
                    type: CoaType.liability
                }
            },
            data: {
                partyId: exp.vendorId,
            },
        });
        if (updated.count > 0) {
            expenseCount += updated.count;
        }
    }
    console.log(`Repaired ${expenseCount} voucher lines based on Expenses.`);

    // 3. Generic repair for Vouchers that have a partyId at the header but not on lines
    // This handles Receipts, Payments, and Manual Purchase Vouchers
    const vouchersWithParty = await prisma.voucher.findMany({
        where: {
            partyId: { not: null },
            status: "posted",
        },
        include: {
            lines: true,
        }
    });

    console.log(`Found ${vouchersWithParty.length} posted vouchers with party header to check.`);
    let genericCount = 0;
    for (const v of vouchersWithParty) {
        if (!v.partyId) continue;

        const hasPartyOnLines = v.lines.some(l => l.partyId !== null);
        if (hasPartyOnLines) continue;

        // Try to identify the correct line to attach the partyId to.
        // For Sales/Receipts: Asset accounts (Receivables)
        // For Purchase/Payments: Liability accounts (Payables)
        
        let targetType: CoaType;
        if (v.voucherType === VoucherType.sales_invoice || v.voucherType === VoucherType.receipt || v.voucherType === VoucherType.sales_return) {
            targetType = CoaType.asset;
        } else if (v.voucherType === VoucherType.purchase || v.voucherType === VoucherType.payment || v.voucherType === VoucherType.purchase_return) {
            targetType = CoaType.liability;
        } else {
            // For Journal or others, we might not know, so we skip or try both
            continue;
        }

        const updated = await prisma.voucherLine.updateMany({
            where: {
                voucherId: v.id,
                partyId: null,
                account: {
                    type: targetType
                }
            },
            data: {
                partyId: v.partyId,
            },
        });
        if (updated.count > 0) {
            genericCount += updated.count;
        }
    }

    console.log(`Repaired ${genericCount} voucher lines based on generic Voucher party matching.`);
    console.log("Repair complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
