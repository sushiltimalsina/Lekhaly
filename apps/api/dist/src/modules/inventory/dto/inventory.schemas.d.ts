import { z } from "zod";
export declare const StockAdjustmentSchema: z.ZodObject<{
    itemId: z.ZodString;
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    qty: z.ZodNumber;
    rate: z.ZodOptional<z.ZodNumber>;
    accountId: z.ZodString;
    memo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const StockQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
