import { z } from "zod";
export declare const LoginSchema: z.ZodObject<{
    companyCode: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    totpCode: z.ZodOptional<z.ZodString>;
    deviceId: z.ZodOptional<z.ZodString>;
    deviceLabel: z.ZodOptional<z.ZodString>;
    rememberDevice: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const TotpEnableSchema: z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>;
export declare const TotpVerifySchema: z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>;
export declare const StepUpSchema: z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>;
export declare const RefreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const RegisterSchema: z.ZodObject<{
    companyCode: z.ZodString;
    companyName: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const ProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CompanySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    baseCurrency: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    fiscalYearStartMonth: z.ZodOptional<z.ZodNumber>;
    invoicePrefix: z.ZodOptional<z.ZodString>;
    purchasePrefix: z.ZodOptional<z.ZodString>;
    salesReturnPrefix: z.ZodOptional<z.ZodString>;
    purchaseReturnPrefix: z.ZodOptional<z.ZodString>;
    orderPrefix: z.ZodOptional<z.ZodString>;
    quotationPrefix: z.ZodOptional<z.ZodString>;
    purchaseOrderPrefix: z.ZodOptional<z.ZodString>;
    receiptPrefix: z.ZodOptional<z.ZodString>;
    paymentPrefix: z.ZodOptional<z.ZodString>;
    journalPrefix: z.ZodOptional<z.ZodString>;
    invoiceSuffix: z.ZodOptional<z.ZodString>;
    purchaseSuffix: z.ZodOptional<z.ZodString>;
    salesReturnSuffix: z.ZodOptional<z.ZodString>;
    purchaseReturnSuffix: z.ZodOptional<z.ZodString>;
    orderSuffix: z.ZodOptional<z.ZodString>;
    quotationSuffix: z.ZodOptional<z.ZodString>;
    purchaseOrderSuffix: z.ZodOptional<z.ZodString>;
    receiptSuffix: z.ZodOptional<z.ZodString>;
    paymentSuffix: z.ZodOptional<z.ZodString>;
    journalSuffix: z.ZodOptional<z.ZodString>;
    nextInvoiceNumber: z.ZodOptional<z.ZodNumber>;
    nextPurchaseNumber: z.ZodOptional<z.ZodNumber>;
    nextSalesReturnNumber: z.ZodOptional<z.ZodNumber>;
    nextPurchaseReturnNumber: z.ZodOptional<z.ZodNumber>;
    nextOrderNumber: z.ZodOptional<z.ZodNumber>;
    nextQuotationNumber: z.ZodOptional<z.ZodNumber>;
    nextPurchaseOrderNumber: z.ZodOptional<z.ZodNumber>;
    nextReceiptNumber: z.ZodOptional<z.ZodNumber>;
    nextPaymentNumber: z.ZodOptional<z.ZodNumber>;
    nextJournalNumber: z.ZodOptional<z.ZodNumber>;
    lockDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    creditLimitAmount: z.ZodOptional<z.ZodNumber>;
    printLogo: z.ZodOptional<z.ZodBoolean>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    panNumber: z.ZodOptional<z.ZodString>;
    vatNumber: z.ZodOptional<z.ZodString>;
    panVat: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const NotificationsSchema: z.ZodObject<{
    emailAlerts: z.ZodOptional<z.ZodBoolean>;
    reportAlerts: z.ZodOptional<z.ZodBoolean>;
    securityAlerts: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
