
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting backfill of VAT and Discount sundries...");

    // 1. Find the company (assuming the one defined in seed or just the first one)
    const company = await prisma.company.findFirst({
        where: { code: "LEKHALY" }
    });

    if (!company) {
        console.error("Company 'LEKHALY' not found. Please create a company first.");
        return;
    }
    const companyId = company.id;
    console.log(`Found company: ${company.name} (${companyId})`);

    // 2. Find necessary Accounts
    const vatPayable = await prisma.chartOfAccount.findFirst({
        where: { companyId, code: "2100" }
    });
    const discountGiven = await prisma.chartOfAccount.findFirst({
        where: { companyId, code: "4100" }
    });

    if (!vatPayable) console.warn("Warning: Account '2100 - VAT Payable' not found.");
    if (!discountGiven) console.warn("Warning: Account '4100 - Discount Given' not found.");

    // 3. Create/Ensure Bill Sundries
    const sundriesToCreate = [];

    if (vatPayable) {
        sundriesToCreate.push({
            companyId,
            name: "VAT",
            type: "add",
            rate: 13,
            accountId: vatPayable.id,
            isActive: true
        });
    }

    if (discountGiven) {
        sundriesToCreate.push({
            companyId,
            name: "Discount",
            type: "less",
            rate: 0,
            accountId: discountGiven.id,
            isActive: true
        });
    }

    // Also enable defaults if missing
    // Note: createMany with skipDuplicates might not work if "name" isn't unique constraint, 
    // but BillSundry doesn't have a unique name constraint in schema (I should check).
    // Checking schema... it doesn't seem to have unique name per company constraint?
    // Step 872 schema view: model BillSundry { ... id, companyId, name ... } no unique constraint shown in view.
    // So best to check if they exist first.

    for (const s of sundriesToCreate) {
        const exists = await prisma.billSundry.findFirst({
            where: { companyId, name: s.name }
        });

        if (!exists) {
            console.log(`Creating missing sundry: ${s.name}`);
            await prisma.billSundry.create({ data: s as any });
        } else {
            console.log(`Sundry '${s.name}' already exists. Skipping.`);
        }
    }

    console.log("Backfill complete.");
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
