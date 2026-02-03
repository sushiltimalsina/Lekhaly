
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient, VoucherType, VoucherStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Prisma } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting Stock Ledger Backfill...");

    // 1. Find all POSTED vouchers that might be missing stock ledger entries
    const vouchers = await prisma.voucher.findMany({
        where: {
            status: VoucherStatus.posted,
            // Only care about purchase/sales
            voucherType: { in: [VoucherType.purchase, VoucherType.purchase_return, VoucherType.sales_invoice, VoucherType.sales_return] }
        },
        include: {
            lines: true,
            stockLedger: true
        }
    });

    console.log(`Found ${vouchers.length} posted vouchers.`);

    let fixedCount = 0;

    for (const voucher of vouchers) {
        if (voucher.stockLedger.length > 0) {
            // Already has stock ledger entries? Maybe verify they are correct?
            // For now, assume if they exist, they are somewhat fine, or maybe we should check if they sum to 0 quantity?
            // Let's just focus on missing ones first.

            // Actually, if the user sees "0", it implies missing or zero-qty entries.
            // Let's check if the stock ledger entries have 0 qty.
            const hasZeroQty = voucher.stockLedger.every(sl => sl.qtyIn.equals(0) && sl.qtyOut.equals(0));
            if (!hasZeroQty) {
                continue; // Has distinct non-zero entries, skip.
            }
            // If hasZeroQty, we might want to delete and recreate? 
            // Or maybe we just append? No, better to delete bad ones.
            console.log(`Voucher ${voucher.voucherNumber} has broken/zero stock entries. Fixing...`);
            await prisma.stockLedger.deleteMany({ where: { voucherId: voucher.id } });
        } else {
            console.log(`Voucher ${voucher.voucherNumber} has NO stock entries. Fixing...`);
        }

        // Create entries
        const itemLines = voucher.lines.filter(l => l.itemId);
        if (itemLines.length === 0) continue;

        const entries = itemLines.map(line => {
            const l = line as any;
            const isPurchase = voucher.voucherType === VoucherType.purchase || voucher.voucherType === VoucherType.purchase_return;
            const isSale = voucher.voucherType === VoucherType.sales_invoice || voucher.voucherType === VoucherType.sales_return;

            let qtyIn = new Prisma.Decimal(0);
            let qtyOut = new Prisma.Decimal(0);
            let amount = new Prisma.Decimal(0);
            let rate = new Prisma.Decimal(0);

            // Logic from service: Trust qty if exists, else 1
            // Since these are OLD lines, they likely have 0 qty. So default to 1.
            // But if my schema update worked, new ones have real qty.
            let quantity = new Prisma.Decimal(1);
            if (l.qty && !l.qty.equals(0)) {
                quantity = l.qty;
            }

            if (isPurchase) {
                amount = l.debit;
                qtyIn = quantity;
                rate = quantity.equals(0) ? new Prisma.Decimal(0) : l.debit.div(quantity);
            } else if (isSale) {
                amount = l.credit;
                qtyOut = quantity;
                rate = quantity.equals(0) ? new Prisma.Decimal(0) : l.credit.div(quantity);
            }

            return {
                companyId: voucher.companyId,
                itemId: l.itemId!, // we filtered for itemId
                date: voucher.voucherDate,
                dateBs: undefined, // simplify
                voucherId: voucher.id,
                qtyIn,
                qtyOut,
                rate,
                amount
            };
        });

        if (entries.length > 0) {
            await prisma.stockLedger.createMany({ data: entries });
            fixedCount++;
        }
    }

    console.log(`Fixed ${fixedCount} vouchers.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
