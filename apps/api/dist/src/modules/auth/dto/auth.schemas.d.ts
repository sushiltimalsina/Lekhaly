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
}, z.core.$strip>;
export declare const NotificationsSchema: z.ZodObject<{
    emailAlerts: z.ZodOptional<z.ZodBoolean>;
    reportAlerts: z.ZodOptional<z.ZodBoolean>;
    securityAlerts: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
