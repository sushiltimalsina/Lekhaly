import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient, ItemType, CoaType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const companies = await prisma.company.findMany();
  console.log(`Found ${companies.length} companies to process...`);

  for (const company of companies) {
    console.log(`Processing company: ${company.name} (${company.id})`);

    await prisma.$transaction(async (tx) => {
      // 1. Seed Units
      const units = ["Pcs", "Box", "Kg", "Ltr", "Set"];
      for (const name of units) {
        await tx.unit.upsert({
          where: { companyId_name: { companyId: company.id, name } },
          update: {},
          create: { companyId: company.id, name }
        });
      }

      // 2. Seed Payment Methods
      const pms = ["Cash", "Bank Transfer", "Online Wallet", "Cheque", "Credit (Pay later)"];
      for (const name of pms) {
        await tx.paymentMethod.upsert({
          where: { companyId_name: { companyId: company.id, name } },
          update: {},
          create: { companyId: company.id, name }
        });
      }

      // 3. Seed Sale Types
      const sts = ["VAT 13% Sales", "Exempt Sales", "Export Sales"];
      for (const name of sts) {
        await tx.saleType.upsert({
          where: { companyId_name: { companyId: company.id, name } },
          update: {},
          create: { companyId: company.id, name }
        });
      }

      // 4. Seed Purchase Types
      const pts = ["VAT 13% Purchase", "Exempt Purchase", "Import Purchase"];
      for (const name of pts) {
        await tx.purchaseType.upsert({
          where: { companyId_name: { companyId: company.id, name } },
          update: {},
          create: { companyId: company.id, name }
        });
      }

      // 5. Seed Template Items
      // Find necessary refs
      const salesAccount = await tx.chartOfAccount.findFirst({ 
        where: { companyId: company.id, name: { contains: "Sales", mode: "insensitive" }, isGroup: false } 
      });
      const cogsAccount = await tx.chartOfAccount.findFirst({ 
        where: { companyId: company.id, name: { contains: "Cost of Goods Sold", mode: "insensitive" }, isGroup: false } 
      });
      const vat13 = await tx.taxCode.findFirst({ 
        where: { companyId: company.id, name: { contains: "VAT 13%", mode: "insensitive" } } 
      });

      if (salesAccount && cogsAccount) {
        const templates = [
          { name: "General Service", type: ItemType.services },
          { name: "Standard Product", type: ItemType.goods, unit: "Pcs" }
        ];

        for (const t of templates) {
          const existing = await tx.item.findFirst({ where: { companyId: company.id, name: t.name } });
          if (!existing) {
            await tx.item.create({
              data: {
                companyId: company.id,
                name: t.name,
                type: t.type,
                unit: t.unit,
                salesPrice: 0,
                incomeAccountId: salesAccount.id,
                expenseAccountId: cogsAccount.id,
                taxCodeId: vat13?.id
              }
            });
          }
        }
      }
    });
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
