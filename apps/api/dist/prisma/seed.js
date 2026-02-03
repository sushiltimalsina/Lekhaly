"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: ".env" });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const argon2_1 = __importDefault(require("argon2"));
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
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
        { code: "settings.users", description: "Manage users/roles" },
        { code: "manage.billSundries", description: "Manage bill sundries" }
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
async function createDemoCompany(permAll) {
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
    async function attach(roleId, codes) {
        await prisma.rolePermission.createMany({
            data: codes.map(code => ({ roleId, permissionCode: code })),
            skipDuplicates: true
        });
    }
    await attach(adminRole.id, permAll);
    await attach(accountantRole.id, permAll);
    await attach(salesRole.id, permSales);
    await attach(viewerRole.id, permViewer);
    const passwordHash = await argon2_1.default.hash("Admin@12345");
    const adminUser = await prisma.user.create({
        data: {
            companyId: company.id,
            email: "admin@lekhaly.local",
            name: "Lekhaly Admin",
            passwordHash
        }
    });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    const cash = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1010", name: "Cash in Hand", type: client_1.CoaType.asset } });
    const bank = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1020", name: "Bank", type: client_1.CoaType.asset } });
    const ar = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1100", name: "Accounts Receivable", type: client_1.CoaType.asset } });
    const vatReceivable = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1110", name: "VAT Receivable", type: client_1.CoaType.asset } });
    await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "1200", name: "Inventory", type: client_1.CoaType.asset } });
    await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "2000", name: "Accounts Payable", type: client_1.CoaType.liability } });
    const vatPayable = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "2100", name: "VAT Payable", type: client_1.CoaType.liability } });
    await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "3000", name: "Owner's Capital", type: client_1.CoaType.equity } });
    const sales = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "4000", name: "Sales", type: client_1.CoaType.income } });
    const discountGiven = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "4100", name: "Discount Given", type: client_1.CoaType.income } });
    const shippingIncome = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "4200", name: "Shipping & Handling Income", type: client_1.CoaType.income } });
    await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "5000", name: "Cost of Goods Sold", type: client_1.CoaType.expense } });
    const discountReceived = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "5100", name: "Discount Received", type: client_1.CoaType.expense } });
    const shippingExpense = await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "5200", name: "Shipping & Handling Expense", type: client_1.CoaType.expense } });
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
    await prisma.billSundry.createMany({
        data: [
            {
                companyId: company.id,
                name: "Discount",
                type: "less",
                rate: 0,
                accountId: discountGiven.id,
                isActive: true
            },
            {
                companyId: company.id,
                name: "VAT",
                type: "add",
                rate: 13,
                accountId: vatPayable.id,
                isActive: true
            },
            {
                companyId: company.id,
                name: "Shipping & Handling",
                type: "add",
                rate: 0,
                accountId: shippingIncome.id,
                isActive: true
            },
            {
                companyId: company.id,
                name: "Packaging Charges",
                type: "add",
                rate: 0,
                accountId: shippingIncome.id,
                isActive: true
            },
            {
                companyId: company.id,
                name: "Insurance",
                type: "add",
                rate: 0,
                accountId: shippingIncome.id,
                isActive: true
            },
            {
                companyId: company.id,
                name: "Round Off",
                type: "add",
                rate: 0,
                accountId: sales.id,
                isActive: true
            }
        ],
        skipDuplicates: true
    });
    await prisma.party.create({
        data: { companyId: company.id, type: client_1.PartyType.customer, name: "Walk-in Customer" }
    });
    return { company, adminUser, cash, bank, ar, sales };
}
async function seedDummyData(companyId) {
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
            type: client_1.ItemType.goods,
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
    const goodsCount = existingItems.filter(item => item.type === client_1.ItemType.goods).length;
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
                    type: client_1.ItemType.goods,
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
    const existingPartyNames = new Set((await prisma.party.findMany({ where: { companyId }, select: { name: true } })).map(party => party.name));
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
            .map(name => ({ companyId, type: client_1.PartyType.customer, name })),
        skipDuplicates: true
    });
    await prisma.party.createMany({
        data: vendors
            .filter(name => !existingPartyNames.has(name))
            .map(name => ({ companyId, type: client_1.PartyType.supplier, name })),
        skipDuplicates: true
    });
    const customerCount = await prisma.party.count({
        where: { companyId, type: { in: [client_1.PartyType.customer, client_1.PartyType.both] } }
    });
    if (customerCount < 10) {
        const needed = 10 - customerCount;
        const fillerCustomers = [];
        let counter = 1;
        while (fillerCustomers.length < needed) {
            const name = `Customer ${String(counter).padStart(2, "0")}`;
            if (!existingPartyNames.has(name)) {
                existingPartyNames.add(name);
                fillerCustomers.push({ companyId, type: client_1.PartyType.customer, name });
            }
            counter += 1;
        }
        await prisma.party.createMany({ data: fillerCustomers });
    }
    const vendorCount = await prisma.party.count({
        where: { companyId, type: { in: [client_1.PartyType.supplier, client_1.PartyType.both] } }
    });
    if (vendorCount < 10) {
        const needed = 10 - vendorCount;
        const fillerVendors = [];
        let counter = 1;
        while (fillerVendors.length < needed) {
            const name = `Vendor ${String(counter).padStart(2, "0")}`;
            if (!existingPartyNames.has(name)) {
                existingPartyNames.add(name);
                fillerVendors.push({ companyId, type: client_1.PartyType.supplier, name });
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
        if (!matchingAdmins.length)
            return null;
        const withCode = matchingAdmins.find(admin => admin.company.code === "LEKHALY");
        if (withCode)
            return withCode;
        return matchingAdmins.sort((a, b) => {
            const aDate = a.company.createdAt?.getTime?.() ?? 0;
            const bDate = b.company.createdAt?.getTime?.() ?? 0;
            return bDate - aDate;
        })[0];
    })();
    let companyId;
    let companyCode = null;
    let adminEmail = existingAdmin?.email ?? "admin@lekhaly.local";
    let cashAccountCode = null;
    let salesAccountCode = null;
    let bankAccountCode = null;
    let arAccountCode = null;
    if (existingAdmin) {
        companyId = existingAdmin.companyId;
        companyCode = existingAdmin.company.code ?? null;
        const rolesToSync = await prisma.role.findMany({
            where: { companyId, name: { in: ["Admin", "Accountant"] } }
        });
        for (const role of rolesToSync) {
            await prisma.rolePermission.createMany({
                data: permAll.map(code => ({ roleId: role.id, permissionCode: code })),
                skipDuplicates: true
            });
        }
    }
    else {
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
//# sourceMappingURL=seed.js.map