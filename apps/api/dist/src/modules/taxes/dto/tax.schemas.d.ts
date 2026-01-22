import { z } from "zod";
export declare const TaxCodeSchema: z.ZodObject<{
    name: z.ZodString;
    rate: z.ZodNumber;
    isInclusive: z.ZodOptional<z.ZodBoolean>;
    inputTaxAccountId: z.ZodOptional<z.ZodString>;
    outputTaxAccountId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const TaxListQuerySchema: z.ZodObject<{
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    q: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const VatReportQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    fromBs: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    toBs: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
