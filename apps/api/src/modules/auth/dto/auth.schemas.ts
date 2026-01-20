import { z } from "zod";

export const LoginSchema = z.object({
  companyId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  totpCode: z.string().trim().optional(),
  deviceId: z.string().uuid().optional(),
  deviceLabel: z.string().trim().min(2).max(64).optional(),
  rememberDevice: z.boolean().optional()
});

export const TotpEnableSchema = z.object({
  code: z.string().trim().min(6).max(10)
});

export const TotpVerifySchema = z.object({
  code: z.string().trim().min(6).max(10)
});

export const StepUpSchema = z.object({
  code: z.string().trim().min(6).max(10)
});

export const RefreshSchema = z.object({
  refreshToken: z.string().trim().min(10)
});

export const RegisterSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const ProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().optional()
});

export const CompanySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  baseCurrency: z.string().trim().min(3).max(3).optional(),
  timezone: z.string().trim().min(2).max(120).optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
  invoicePrefix: z.string().trim().min(1).max(10).optional()
});

export const NotificationsSchema = z.object({
  emailAlerts: z.boolean().optional(),
  reportAlerts: z.boolean().optional(),
  securityAlerts: z.boolean().optional()
});
