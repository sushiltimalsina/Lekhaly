import { z } from "zod";

export const LoginSchema = z.object({
  companyCode: z.string().trim().min(3).max(20).optional(),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
  deviceId: z.string().uuid().optional()
});

export const LoginTotpSchema = z.object({
  challengeToken: z.string().trim().min(20),
  code: z.string().trim().regex(/^(?:[0-9]{6}|[a-fA-F0-9]{10})$/),
  deviceId: z.string().uuid().optional(),
  rememberDevice: z.boolean().optional()
});

export const TotpEnableSchema = z.object({
  code: z.string().trim().length(6)
});

export const TotpDisablePasswordSchema = z.object({
  password: z.string().min(1).max(128)
});

export const TotpDisableSchema = z.object({
  challengeToken: z.string().trim().min(20),
  method: z.enum(["authenticator", "recovery"]),
  code: z.string().trim().regex(/^(?:[0-9]{6}|[a-fA-F0-9]{10})$/)
});

export const TotpRecoveryRegenerateSchema = z.object({
  challengeToken: z.string().trim().min(20),
  code: z.string().trim().regex(/^\d{6}$/)
});

export const TotpRecoveryRegeneratePasswordSchema = z.object({
  password: z.string().min(1).max(128)
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

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase())
});

export const ResetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/\d/, "Password must include a number")
    .regex(/[^\w\s]/, "Password must include a symbol")
});

export const RegisterSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/\d/, "Password must include a number")
    .regex(/[^\w\s]/, "Password must include a symbol")
});

export const GoogleAuthStartSchema = z.object({
  intent: z.enum(["login", "register"]),
  clientOrigin: z.string().url().max(2048),
  deviceId: z.string().uuid().optional()
});

export const GoogleAuthCallbackSchema = z.object({
  code: z.string().trim().min(1).optional(),
  state: z.string().trim().min(20),
  error: z.string().trim().max(120).optional()
});

export const LinkedInAuthStartSchema = GoogleAuthStartSchema;
export const LinkedInAuthCallbackSchema = GoogleAuthCallbackSchema;
export const MicrosoftAuthStartSchema = GoogleAuthStartSchema;
export const MicrosoftAuthCallbackSchema = GoogleAuthCallbackSchema;

export const ProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().optional()
});

export const CompanySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  baseCurrency: z.string().trim().min(3).max(3).optional(),
  timezone: z.string().trim().min(2).max(120).optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
  invoicePrefix: z.string().trim().min(1).max(10).optional(),
  purchasePrefix: z.string().trim().min(1).max(10).optional(),
  salesReturnPrefix: z.string().trim().min(1).max(10).optional(),
  purchaseReturnPrefix: z.string().trim().min(1).max(10).optional(),
  orderPrefix: z.string().trim().min(1).max(10).optional(),
  quotationPrefix: z.string().trim().min(1).max(10).optional(),
  purchaseOrderPrefix: z.string().trim().min(1).max(10).optional(),
  receiptPrefix: z.string().trim().min(1).max(10).optional(),
  paymentPrefix: z.string().trim().min(1).max(10).optional(),
  journalPrefix: z.string().trim().min(0).max(10).optional(),
  invoiceSuffix: z.string().trim().max(10).optional(),
  purchaseSuffix: z.string().trim().max(10).optional(),
  salesReturnSuffix: z.string().trim().max(10).optional(),
  purchaseReturnSuffix: z.string().trim().max(10).optional(),
  orderSuffix: z.string().trim().max(10).optional(),
  quotationSuffix: z.string().trim().max(10).optional(),
  purchaseOrderSuffix: z.string().trim().max(10).optional(),
  receiptSuffix: z.string().trim().max(10).optional(),
  paymentSuffix: z.string().trim().max(10).optional(),
  journalSuffix: z.string().trim().max(10).optional(),
  nextInvoiceNumber: z.number().int().min(1).optional(),
  nextPurchaseNumber: z.number().int().min(1).optional(),
  nextSalesReturnNumber: z.number().int().min(1).optional(),
  nextPurchaseReturnNumber: z.number().int().min(1).optional(),
  nextOrderNumber: z.number().int().min(1).optional(),
  nextQuotationNumber: z.number().int().min(1).optional(),
  nextPurchaseOrderNumber: z.number().int().min(1).optional(),
  nextReceiptNumber: z.number().int().min(1).optional(),
  nextPaymentNumber: z.number().int().min(1).optional(),
  nextJournalNumber: z.number().int().min(1).optional(),
  lockDate: z.string().datetime().nullable().optional(),
  creditLimitAmount: z.number().min(0).optional(),
  printLogo: z.boolean().optional(),
  address: z.string().trim().max(500).nullish(),
  phone: z.string().trim().max(50).nullish(),
  mobileNumber: z.string().trim().max(50).nullish(),
  email: z.string().email().nullish(),
  ownerName: z.string().trim().max(120).nullish(),
  panVatNumber: z.string().trim().max(50).nullish(),
  companyRegistrationNumber: z.string().trim().max(100).nullish(),
  localRegistrationNumber: z.string().trim().max(100).nullish(),
  dftqcNumber: z.string().trim().max(100).nullish(),
  tole: z.string().trim().max(200).nullish(),
  province: z.string().trim().max(100).nullish(),
  district: z.string().trim().max(100).nullish(),
  localLevel: z.string().trim().max(150).nullish(),
  ward: z.number().int().min(1).max(99).nullish(),
  panVat: z.string().trim().max(100).optional(), // Legacy support
});

export const CompleteCompanyOnboardingSchema = CompanySchema.extend({
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  fiscalYearStartDateBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const NotificationsSchema = z.object({
  emailAlerts: z.boolean().optional(),
  reportAlerts: z.boolean().optional(),
  securityAlerts: z.boolean().optional()
});
