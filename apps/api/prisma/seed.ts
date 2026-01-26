import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { PrismaClient, CoaType, PartyType, ItemType } from "@prisma/client";
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

async function createDemoCompany(permAll: string[]) {
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

  return { company, adminUser, cash, bank, ar, sales };
}

async function seedDummyData(companyId: string) {
  const [salesAccount, cogsAccount, vat13] = await Promise.all([
    prisma.chartOfAccount.findFirst({ where: { companyId, code: "4000" } }),
    prisma.chartOfAccount.findFirst({ where: { companyId, code: "5000" } }),
    prisma.taxCode.findFirst({ where: { companyId, name: "VAT 13%" } })
  ]);

  const unitNames = ["pcs", "box", "kg", "liter", "set", "pack", "roll", "bag", "pair"];
  await prisma.unit.createMany({
    data: unitNames.map(name => ({ companyId, name })),
    skipDuplicates: true
  });

  const groupNames = ["Electronics", "Office Supplies", "Furniture", "Packaging", "Tools"];
  await prisma.itemGroup.createMany({
    data: groupNames.map(name => ({ companyId, name })),
    skipDuplicates: true
  });
  const groups = await prisma.itemGroup.findMany({ where: { companyId, name: { in: groupNames } } });
  const groupByName = new Map(groups.map(group => [group.name, group.id]));

  const items = [
    { name: "A4 Copy Paper (500 sheets)", sku: "PAP-A4-500", unit: "pack", group: "Office Supplies", salesPrice: 450, purchasePrice: 320 },
    { name: "Ballpoint Pen - Blue", sku: "PEN-BLUE-01", unit: "box", group: "Office Supplies", salesPrice: 180, purchasePrice: 120 },
    { name: "Stapler Medium", sku: "STP-MD-01", unit: "pcs", group: "Office Supplies", salesPrice: 280, purchasePrice: 210 },
    { name: "USB Flash Drive 32GB", sku: "USB-32G-01", unit: "pcs", group: "Electronics", salesPrice: 950, purchasePrice: 720 },
    { name: "USB Flash Drive 64GB", sku: "USB-64G-01", unit: "pcs", group: "Electronics", salesPrice: 1450, purchasePrice: 1120 },
    { name: "Wireless Mouse", sku: "MOU-WL-01", unit: "pcs", group: "Electronics", salesPrice: 850, purchasePrice: 640 },
    { name: "Keyboard - Standard", sku: "KEY-STD-01", unit: "pcs", group: "Electronics", salesPrice: 1100, purchasePrice: 820 },
    { name: "Power Bank 10000mAh", sku: "PWB-10K-01", unit: "pcs", group: "Electronics", salesPrice: 2100, purchasePrice: 1650 },
    { name: "LED Bulb 12W", sku: "LED-12W-01", unit: "pcs", group: "Electronics", salesPrice: 220, purchasePrice: 150 },
    { name: "Extension Cord 3m", sku: "EXT-3M-01", unit: "pcs", group: "Electronics", salesPrice: 380, purchasePrice: 260 },
    { name: "Office Chair - Mesh", sku: "CHR-MSH-01", unit: "pcs", group: "Furniture", salesPrice: 6500, purchasePrice: 5200 },
    { name: "Wooden Desk 4ft", sku: "DSK-4F-01", unit: "pcs", group: "Furniture", salesPrice: 9200, purchasePrice: 7400 },
    { name: "Filing Cabinet 3-Drawer", sku: "CAB-3D-01", unit: "pcs", group: "Furniture", salesPrice: 7800, purchasePrice: 6200 },
    { name: "Packaging Tape 2in", sku: "TAP-2IN-01", unit: "roll", group: "Packaging", salesPrice: 120, purchasePrice: 80 },
    { name: "Carton Box Small", sku: "BOX-S-01", unit: "pcs", group: "Packaging", salesPrice: 45, purchasePrice: 30 },
    { name: "Carton Box Medium", sku: "BOX-M-01", unit: "pcs", group: "Packaging", salesPrice: 70, purchasePrice: 50 },
    { name: "Carton Box Large", sku: "BOX-L-01", unit: "pcs", group: "Packaging", salesPrice: 95, purchasePrice: 70 },
    { name: "Cleaning Gloves - Pair", sku: "GLV-PR-01", unit: "pair", group: "Tools", salesPrice: 160, purchasePrice: 110 },
    { name: "Tool Kit Basic", sku: "TKT-BSC-01", unit: "set", group: "Tools", salesPrice: 2600, purchasePrice: 2100 },
    { name: "Measuring Tape 5m", sku: "TAP-5M-01", unit: "pcs", group: "Tools", salesPrice: 350, purchasePrice: 240 }
  ];

  await prisma.item.createMany({
    data: items.map(item => ({
      companyId,
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      groupId: groupByName.get(item.group) ?? null,
      type: ItemType.goods,
      salesPrice: item.salesPrice,
      purchasePrice: item.purchasePrice,
      incomeAccountId: salesAccount?.id ?? null,
      expenseAccountId: cogsAccount?.id ?? null,
      taxCodeId: vat13?.id ?? null
    })),
    skipDuplicates: true
  });

  const existingItems = await prisma.item.findMany({
    where: { companyId },
    select: { name: true, type: true }
  });
  const existingItemNames = new Set(existingItems.map(item => item.name));
  const goodsCount = existingItems.filter(item => item.type === ItemType.goods).length;

  if (goodsCount < 20) {
    const fillerItems = [];
    let counter = 1;
    while (fillerItems.length < 20 - goodsCount) {
      const seq = String(counter).padStart(2, "0");
      const name = `Sample Item ${seq}`;
      if (!existingItemNames.has(name)) {
        existingItemNames.add(name);
        fillerItems.push({
          companyId,
          name,
          sku: `SMP-${seq}`,
          unit: "pcs",
          type: ItemType.goods,
          salesPrice: 300 + counter * 20,
          purchasePrice: 220 + counter * 15,
          incomeAccountId: salesAccount?.id ?? null,
          expenseAccountId: cogsAccount?.id ?? null,
          taxCodeId: vat13?.id ?? null
        });
      }
      counter += 1;
    }

    await prisma.item.createMany({
      data: fillerItems,
      skipDuplicates: true
    });
  }

  const existingPartyNames = new Set(
    (await prisma.party.findMany({ where: { companyId }, select: { name: true } })).map(party => party.name)
  );

  const customers = [
    "Himal Traders",
    "Kathmandu Bookstore",
    "Green Valley Grocers",
    "Lotus Cafe",
    "Everest Hardware",
    "Mithila Stationery",
    "Sunrise Electronics",
    "Patan Office Mart",
    "Bhaktapur Mart",
    "Thamel Supplies"
  ];

  const vendors = [
    "Everest Supplies Co.",
    "Himalaya Imports",
    "Durbar Wholesale",
    "Sagarmatha Distributors",
    "Pashupati Packaging",
    "Koshi Tools",
    "Bagmati Traders",
    "Gandaki Furniture",
    "Lumbini Office Goods",
    "Makalu Tech Traders"
  ];

  await prisma.party.createMany({
    data: customers
      .filter(name => !existingPartyNames.has(name))
      .map(name => ({ companyId, type: PartyType.customer, name })),
    skipDuplicates: true
  });

  await prisma.party.createMany({
    data: vendors
      .filter(name => !existingPartyNames.has(name))
      .map(name => ({ companyId, type: PartyType.supplier, name })),
    skipDuplicates: true
  });

  const customerCount = await prisma.party.count({
    where: { companyId, type: { in: [PartyType.customer, PartyType.both] } }
  });
  if (customerCount < 10) {
    const needed = 10 - customerCount;
    const fillerCustomers = [];
    let counter = 1;
    while (fillerCustomers.length < needed) {
      const name = `Customer ${String(counter).padStart(2, "0")}`;
      if (!existingPartyNames.has(name)) {
        existingPartyNames.add(name);
        fillerCustomers.push({ companyId, type: PartyType.customer, name });
      }
      counter += 1;
    }
    await prisma.party.createMany({ data: fillerCustomers });
  }

  const vendorCount = await prisma.party.count({
    where: { companyId, type: { in: [PartyType.supplier, PartyType.both] } }
  });
  if (vendorCount < 10) {
    const needed = 10 - vendorCount;
    const fillerVendors = [];
    let counter = 1;
    while (fillerVendors.length < needed) {
      const name = `Vendor ${String(counter).padStart(2, "0")}`;
      if (!existingPartyNames.has(name)) {
        existingPartyNames.add(name);
        fillerVendors.push({ companyId, type: PartyType.supplier, name });
      }
      counter += 1;
    }
    await prisma.party.createMany({ data: fillerVendors });
  }
}

async function main() {
  const permAll = await upsertPermissions();

  const targetEmails = ["admin@lekhaky.local", "admin@lekhaly.local"];
  const matchingAdmins = await prisma.user.findMany({
    where: { email: { in: targetEmails } },
    include: { company: true }
  });
  const existingAdmin = (() => {
    if (!matchingAdmins.length) return null;
    const withCode = matchingAdmins.find(admin => admin.company.code === "LEKHALY");
    if (withCode) return withCode;
    return matchingAdmins.sort((a, b) => {
      const aDate = a.company.createdAt?.getTime?.() ?? 0;
      const bDate = b.company.createdAt?.getTime?.() ?? 0;
      return bDate - aDate;
    })[0];
  })();

  let companyId: string;
  let companyCode: string | null = null;
  let adminEmail = existingAdmin?.email ?? "admin@lekhaly.local";
  let cashAccountCode: string | null = null;
  let salesAccountCode: string | null = null;
  let bankAccountCode: string | null = null;
  let arAccountCode: string | null = null;

  if (existingAdmin) {
    companyId = existingAdmin.companyId;
    companyCode = existingAdmin.company.code ?? null;
  } else {
    const created = await createDemoCompany(permAll);
    companyId = created.company.id;
    companyCode = created.company.code ?? null;
    adminEmail = created.adminUser.email;
    cashAccountCode = created.cash.code;
    salesAccountCode = created.sales.code;
    bankAccountCode = created.bank.code;
    arAccountCode = created.ar.code;
  }

  await seedDummyData(companyId);

  console.log("Seed completed:");
  console.log("CompanyId:", companyId);
  if (companyCode) {
    console.log("CompanyCode:", companyCode);
  }
  console.log("Admin login:", `${adminEmail} / Admin@12345`);
  if (cashAccountCode) {
    console.log("Cash account:", cashAccountCode);
  }
  if (salesAccountCode) {
    console.log("Sales account:", salesAccountCode);
  }
  if (bankAccountCode) {
    console.log("Bank account:", bankAccountCode);
  }
  if (arAccountCode) {
    console.log("A/R account:", arAccountCode);
  }
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
