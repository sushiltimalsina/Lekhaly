
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient, VoucherType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Prisma } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Debugging Quantity Issue...");

    // 1. Create a dummy item if needed, or find one
    const item = await prisma.item.findFirst();
    if (!item) {
        console.log("No items found to test with.");
        return;
    }
    const company = await prisma.company.findFirst();
    if (!company) return;

    // 2. Create a Voucher Line with Qty 123
    const qtyInput = new Prisma.Decimal(123);

    const voucher = await prisma.voucher.create({
        data: {
            companyId: company.id,
            voucherType: VoucherType.purchase,
            voucherDate: new Date(),
            voucherNumber: "DEBUG-QTY-TEST",
            partyId: null,
            lines: {
                create: [
                    {
                        companyId: company.id,
                        lineNo: 1,
                        accountId: item.expenseAccountId || item.incomeAccountId || (await prisma.chartOfAccount.findFirst())?.id!,
                        itemId: item.id,
                        description: "Debug Qty",
                        debit: new Prisma.Decimal(1000),
                        credit: new Prisma.Decimal(0),
                        qty: qtyInput // Setting explicit qty
                    } as any
                ]
            }
        },
        include: {
            lines: true
        }
    });

    console.log("Created Voucher with ID:", voucher.id);
    console.log("Input Qty:", qtyInput.toString());

    const savedLine = voucher.lines[0] as any;
    console.log("Saved Line Qty (raw):", savedLine.qty);
    console.log("Saved Line Qty (toString):", savedLine.qty?.toString());

    if (savedLine.qty && savedLine.qty.equals(qtyInput)) {
        console.log("SUCCESS: Quantity saved correctly!");
    } else {
        console.log("FAILURE: Quantity mismatch or missing!", savedLine);
    }

    // Cleanup
    await prisma.voucher.delete({ where: { id: voucher.id } });
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
