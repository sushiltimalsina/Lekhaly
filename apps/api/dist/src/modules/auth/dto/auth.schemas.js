"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileSchema = exports.RegisterSchema = exports.RefreshSchema = exports.StepUpSchema = exports.TotpVerifySchema = exports.TotpEnableSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
exports.LoginSchema = zod_1.z.object({
    companyId: zod_1.z.string().uuid(),
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
    companyName: zod_1.z.string().trim().min(2).max(120),
    name: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128)
});
exports.ProfileSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(120).optional(),
    email: zod_1.z.string().email().optional()
});
//# sourceMappingURL=auth.schemas.js.map