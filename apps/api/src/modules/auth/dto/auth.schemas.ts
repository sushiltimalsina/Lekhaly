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
