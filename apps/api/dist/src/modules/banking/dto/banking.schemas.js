"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankSyncConnectSchema = exports.BankStatementListQuerySchema = exports.ReconcileSchema = exports.AddStatementLineSchema = exports.CreateBankStatementSchema = exports.CreateBankAccountSchema = void 0;
const zod_1 = require("zod");
exports.CreateBankAccountSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid(),
    bankName: zod_1.z.string().trim().max(100).optional(),
    accountNumber: zod_1.z.string().trim().max(50).optional()
});
exports.CreateBankStatementSchema = zod_1.z.object({
    bankAccountId: zod_1.z.string().uuid(),
    periodFrom: zod_1.z.coerce.date().optional(),
    periodFromBs: zod_1.z.string().trim().max(20).optional(),
    periodTo: zod_1.z.coerce.date().optional(),
    periodToBs: zod_1.z.string().trim().max(20).optional(),
    openingBalance: zod_1.z.number(),
    closingBalance: zod_1.z.number()
}).superRefine((data, ctx) => {
    if (!data.periodFrom && !data.periodFromBs) {
        ctx.addIssue({ code: "custom", message: "periodFrom or periodFromBs is required", path: ["periodFrom"] });
    }
    if (!data.periodTo && !data.periodToBs) {
        ctx.addIssue({ code: "custom", message: "periodTo or periodToBs is required", path: ["periodTo"] });
    }
});
exports.AddStatementLineSchema = zod_1.z.object({
    date: zod_1.z.coerce.date().optional(),
    dateBs: zod_1.z.string().trim().max(20).optional(),
    description: zod_1.z.string().trim().max(500).optional(),
    amount: zod_1.z.number(),
    debitCredit: zod_1.z.enum(["debit", "credit"])
}).superRefine((data, ctx) => {
    if (!data.date && !data.dateBs) {
        ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
    }
});
exports.ReconcileSchema = zod_1.z.object({
    statementLineId: zod_1.z.string().uuid(),
    voucherId: zod_1.z.string().uuid(),
    voucherLineId: zod_1.z.string().uuid().optional()
});
exports.BankStatementListQuerySchema = zod_1.z.object({
    bankAccountId: zod_1.z.string().uuid().optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    skip: zod_1.z.coerce.number().int().min(0).optional(),
    take: zod_1.z.coerce.number().int().min(1).max(200).optional()
});
exports.BankSyncConnectSchema = zod_1.z.object({
    provider: zod_1.z.string().trim().min(2).max(50),
    bankAccountId: zod_1.z.string().uuid().optional()
});
//# sourceMappingURL=banking.schemas.js.map