import { z } from "zod";
export declare const DeviceListQuerySchema: z.ZodObject<{
    trusted: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const DeviceTrustSchema: z.ZodObject<{
    trusted: z.ZodCoercedBoolean<unknown>;
}, z.core.$strip>;
