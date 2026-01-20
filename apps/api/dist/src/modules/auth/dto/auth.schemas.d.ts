import { z } from "zod";
export declare const LoginSchema: z.ZodObject<{
    companyId: z.ZodString;
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
    companyName: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const ProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
