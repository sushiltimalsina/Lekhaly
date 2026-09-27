import * as path from "path";
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { CoaSeederService, DEFAULT_ACCOUNTS } from "../src/modules/accounts/coa-seeder.service";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const seeder = new CoaSeederService();
const legacyNames = new Map<string, Set<string>>([
  ["4120", new Set(["Discount Given", "Discounts Given"])],
  ["5200", new Set(["Administrative Expenses"])],
]);

async function main() {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          vouchers: true,
          voucherLines: true,
          invoices: true,
          items: true,
          taxCodes: true,
          billSundries: true,
          bankAccounts: true,
        },
      },
      accounts: {
        select: {
          code: true,
          name: true,
          isContra: true,
          parent: { select: { code: true } },
          _count: {
            select: {
              voucherLines: true,
              bankAccounts: true,
              invoices: true,
              incomeItems: true,
              expenseItems: true,
              inputTaxCodes: true,
              outputTaxCodes: true,
              billSundries: true,
              invoiceSundries: true,
              quotationSundries: true,
              salesOrderSundries: true,
              purchaseOrderSundries: true,
            },
          },
        },
      },
    },
  });
  const definitions = new Map(DEFAULT_ACCOUNTS.map(account => [account.code, account]));
  const conflicts = companies.flatMap(company => company.accounts.flatMap(account => {
    const definition = definitions.get(account.code);
    if (!definition || account.name === definition.name || legacyNames.get(account.code)?.has(account.name)) return [];
    return [{
      companyId: company.id,
      company: company.name,
      code: account.code,
      existingName: account.name,
      expectedName: definition.name,
      references: account._count,
    }];
  }));
  const blockedCompanyIds = new Set(conflicts.map(conflict => conflict.companyId));
  const eligibleCompanies = companies.filter(company => !blockedCompanyIds.has(company.id));

  const plan = companies.map(company => {
    const existingCodes = new Set(company.accounts.map(account => account.code));
    const seededRows = DEFAULT_ACCOUNTS.filter(account => existingCodes.has(account.code));
    return {
      company: company.name,
      existingAccounts: company.accounts.length,
      contraAccounts: company.accounts
        .filter(account => account.isContra)
        .map(({ code, name, parent }) => ({ code, name, parentCode: parent?.code })),
      records: company._count,
      defaultRowsToAdd: DEFAULT_ACCOUNTS.length - seededRows.length,
      blockedByCodeConflicts: blockedCompanyIds.has(company.id),
      legacyNamesToUpdate: seededRows.filter(account =>
        legacyNames.get(account.code)?.has(company.accounts.find(existing => existing.code === account.code)?.name ?? "")
      ).length,
    };
  });

  console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "dry-run", plan, conflicts }, null, 2));
  if (!process.argv.includes("--apply")) {
    console.log("Dry run only. Pass --apply to seed eligible companies; blocked companies will remain unchanged.");
    return;
  }

  if (!eligibleCompanies.length) {
    console.log("No eligible companies to update; no rows were changed.");
    return;
  }

  await prisma.$transaction(async tx => {
    for (const company of eligibleCompanies) {
      await seeder.seedNfrs(tx, company.id);
    }
  });

  console.log(`Seeded ${DEFAULT_ACCOUNTS.length} default COA rows for ${eligibleCompanies.length} companies.`);
  if (blockedCompanyIds.size) console.log(`Skipped ${blockedCompanyIds.size} company with conflicting account codes.`);
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
