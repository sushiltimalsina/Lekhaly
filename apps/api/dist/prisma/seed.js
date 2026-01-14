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
    const company = await prisma.company.create({
        data: {
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
    await prisma.chartOfAccount.create({ data: { companyId: company.id, code: "5000", name: "Cost of Goods Sold", type: client_1.CoaType.expense } });
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
    await prisma.party.create({
        data: { companyId: company.id, type: client_1.PartyType.customer, name: "Walk-in Customer" }
    });
    console.log("Seed completed:");
    console.log("CompanyId:", company.id);
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
//# sourceMappingURL=seed.js.map