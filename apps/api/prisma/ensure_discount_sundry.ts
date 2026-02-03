
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Ensuring Discount Sundry exists...");

    const company = await prisma.company.findFirst({
        where: { code: "LEKHALY" }
    });

    if (!company) {
        console.error("Company 'LEKHALY' not found.");
        return;
    }
    const companyId = company.id;

    // 1. Ensure 'Discount Given' Account Exists
    let discountAccount = await prisma.chartOfAccount.findFirst({
        where: { companyId, code: "4100" }
    });

    if (!discountAccount) {
        console.log("Account 4100 (Discount Given) missing. Creating it...");
        discountAccount = await prisma.chartOfAccount.create({
            data: {
                companyId,
                code: "4100",
                name: "Discount Given",
                type: "income"
            }
        });
    }

    // 2. Ensure 'Discount' Sundry Exists
    const sundryName = "Discount";
    const existingSundry = await prisma.billSundry.findFirst({
        where: { companyId, name: sundryName }
    });

    if (!existingSundry) {
        console.log(`Creating Bill Sundry: ${sundryName} linked to account ${discountAccount.name}`);
        await prisma.billSundry.create({
            data: {
                companyId,
                name: sundryName,
                type: "less", // Default behavior
                rate: 0,
                accountId: discountAccount.id,
                isActive: true
            }
        });
    } else {
        console.log("Discount sundry already exists.");
    }

    console.log("Done.");
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
