import { z } from "zod";

export const LoginSchema = z.object({
  companyCode: z.string().trim().min(3).max(20),
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
  companyCode: z.string().trim().min(3).max(20),
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
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().email().optional(),
  panNumber: z.string().trim().max(50).optional(),
  vatNumber: z.string().trim().max(50).optional(),
  panVat: z.string().trim().max(100).optional(), // Legacy support
});

export const NotificationsSchema = z.object({
  emailAlerts: z.boolean().optional(),
  reportAlerts: z.boolean().optional(),
  securityAlerts: z.boolean().optional()
});
