"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsSchema = exports.CompanySchema = exports.ProfileSchema = exports.RegisterSchema = exports.RefreshSchema = exports.StepUpSchema = exports.TotpVerifySchema = exports.TotpEnableSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
exports.LoginSchema = zod_1.z.object({
    companyCode: zod_1.z.string().trim().min(3).max(20),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    totpCode: zod_1.z.string().trim().optional(),
    deviceId: zod_1.z.string().uuid().optional(),
    deviceLabel: zod_1.z.string().trim().min(2).max(64).optional(),
    rememberDevice: zod_1.z.boolean().optional()
});
exports.TotpEnableSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(6).max(10)
});
exports.TotpVerifySchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(6).max(10)
});
exports.StepUpSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(6).max(10)
});
exports.RefreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().trim().min(10)
});
exports.RegisterSchema = zod_1.z.object({
    companyCode: zod_1.z.string().trim().min(3).max(20),
    companyName: zod_1.z.string().trim().min(2).max(120),
    name: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128)
});
exports.ProfileSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120).optional(),
    email: zod_1.z.string().email().optional()
});
exports.CompanySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120).optional(),
    baseCurrency: zod_1.z.string().trim().min(3).max(3).optional(),
    timezone: zod_1.z.string().trim().min(2).max(120).optional(),
    fiscalYearStartMonth: zod_1.z.number().int().min(1).max(12).optional(),
    invoicePrefix: zod_1.z.string().trim().min(1).max(10).optional(),
    orderPrefix: zod_1.z.string().trim().min(1).max(10).optional(),
    quotationPrefix: zod_1.z.string().trim().min(1).max(10).optional(),
    purchaseOrderPrefix: zod_1.z.string().trim().min(1).max(10).optional(),
    nextInvoiceNumber: zod_1.z.number().int().min(1).optional(),
    nextOrderNumber: zod_1.z.number().int().min(1).optional(),
    nextQuotationNumber: zod_1.z.number().int().min(1).optional(),
    nextPurchaseOrderNumber: zod_1.z.number().int().min(1).optional(),
    lockDate: zod_1.z.string().datetime().nullable().optional(),
    creditLimitAmount: zod_1.z.number().min(0).optional(),
    printLogo: zod_1.z.boolean().optional(),
});
exports.NotificationsSchema = zod_1.z.object({
    emailAlerts: zod_1.z.boolean().optional(),
    reportAlerts: zod_1.z.boolean().optional(),
    securityAlerts: zod_1.z.boolean().optional()
});
//# sourceMappingURL=auth.schemas.js.map