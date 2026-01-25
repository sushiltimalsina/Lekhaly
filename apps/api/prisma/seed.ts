import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient, CoaType, PartyType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import argon2 from "argon2";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function upsertPermissions() {
  const permissions = [
    { code: "masters.read", description: "Read masters" },
    { code: "masters.write", description: "Create/update masters" },

    { code: "voucher.draft.create", description: "Create voucher drafts" },
    { code: "voucher.draft.edit", description: "Edit voucher drafts" },
    { code: "voucher.preview", description: "Preview voucher posting" },
    { code: "voucher.post", description: "Post vouchers" },
    { code: "voucher.void", description: "Void vouchers" },

    { code: "reports.view", description: "View reports" },
    { code: "export.pdf", description: "Export PDFs" },

    { code: "settings.security", description: "Manage security settings" },
    { code: "settings.tax", description: "Manage tax settings" },
    { code: "settings.coa", description: "Manage chart of accounts" },
    { code: "settings.users", description: "Manage users/roles" }
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: p
    });
  }

  return permissions.map(p => p.code);
}

async function main() {
  const permAll = await upsertPermissions();

  // Company (create once; if rerun, create another demo companyfine for now)
  const company = await prisma.company.create({
    data: {
      code: "LEKHALY",
      name: "Lekhaly Demo Company",
      baseCurrency: "NPR",
      timezone: "Asia/Kathmandu",
      fiscalYearStartMonth: 4,
      invoicePrefix: "INV",
      nextInvoiceNumber: 1
    }
  });

  // Roles
  const [adminRole, accountantRole, salesRole, viewerRole] = await Promise.all([
    prisma.role.create({ data: { companyId: company.id, name: "Admin" } }),
    prisma.role.create({ data: { companyId: company.id, name: "Accountant" } }),
    prisma.role.create({ data: { companyId: company.id, name: "Sales" } }),
    prisma.role.create({ data: { companyId: company.id, name: "Viewer" } })
  ]);

  const permSales = ["masters.read", "voucher.draft.create", "voucher.draft.edit", "voucher.preview", "reports.view", "export.pdf"];
  const permViewer = ["masters.read", "reports.view"];

  async function attach(roleId: string, codes: string[]) {
    await prisma.rolePermission.createMany({
      data: codes.map(code => ({ roleId, permissionCode: code })),
      skipDuplicates: true
    });
  }

  await attach(adminRole.id, permAll);
  await attach(accountantRole.id, permAll);
  await attach(salesRole.id, permSales);
  await attach(viewerRole.id, permViewer);

  // Admin user (demo)
  const passwordHash = await argon2.hash("Admin@12345");
  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: "admin@lekhaly.local",
      name: "Lekhaly Admin",
      passwordHash
    }
  });
  await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });

  // Nepal-friendly starter COA (MVP)
  const cash = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1010", name: "Cash in Hand", type: CoaType.asset } });
  const bank = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1020", name: "Bank", type: CoaType.asset } });
  const ar   = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1100", name: "Accounts Receivable", type: CoaType.asset } });
  const vatReceivable = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1110", name: "VAT Receivable", type: CoaType.asset } });
  await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1200", name: "Inventory", type: CoaType.asset } });

  await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "2000", name: "Accounts Payable", type: CoaType.liability } });
  const vatPayable = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "2100", name: "VAT Payable", type: CoaType.liability } });

  await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "3000", name: "Owner's Capital", type: CoaType.equity } });

  const sales = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "4000", name: "Sales", type: CoaType.income } });
  await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "5000", name: "Cost of Goods Sold", type: CoaType.expense } });

  // VAT 13%
  await prisma.taxCode.create({
    data: {
      companyId: company.id,
      name: "VAT 13%",
      rate: 13.0,
      isInclusive: false,
      inputTaxAccountId: vatReceivable.id,
      outputTaxAccountId: vatPayable.id
    }
  });

  await prisma.taxCode.createMany({
    data: [
      {
        companyId: company.id,
        name: "Digital Service Tax (DST) 2%",
        rate: 2.0,
        isInclusive: false,
        inputTaxAccountId: vatReceivable.id,
        outputTaxAccountId: vatPayable.id
      },
      {
        companyId: company.id,
        name: "Excise Duty",
        rate: 0.0,
        isInclusive: false,
        inputTaxAccountId: vatReceivable.id,
        outputTaxAccountId: vatPayable.id
      },
      {
        companyId: company.id,
        name: "Customs Duty (Import/Export Duties)",
        rate: 0.0,
        isInclusive: false,
        inputTaxAccountId: vatReceivable.id,
        outputTaxAccountId: vatPayable.id
      },
      {
        companyId: company.id,
        name: "Other Indirect Taxes/Fees",
        rate: 0.0,
        isInclusive: false,
        inputTaxAccountId: vatReceivable.id,
        outputTaxAccountId: vatPayable.id
      }
    ],
    skipDuplicates: true
  });

  await prisma.party.create({
    data: { companyId: company.id, type: PartyType.customer, name: "Walk-in Customer" }
  });

  console.log("Seed completed:");
  console.log("CompanyId:", company.id);
  console.log("CompanyCode:", company.code);
  console.log("Admin login:", "admin@lekhaly.local / Admin@12345");
  console.log("Cash account:", cash.code, cash.name);
  console.log("Sales account:", sales.code, sales.name);
  console.log("Bank account:", bank.code, bank.name);
  console.log("A/R account:", ar.code, ar.name);
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
