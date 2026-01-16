import { z } from "zod";
export declare const ReportQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
