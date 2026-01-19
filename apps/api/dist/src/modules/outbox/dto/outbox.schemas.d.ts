import { z } from "zod";
export declare const OutboxListQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        processed: "processed";
        failed: "failed";
    }>>;
    type: z.ZodOptional<z.ZodString>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const OutboxAckSchema: z.ZodObject<{
    status: z.ZodEnum<{
        processed: "processed";
        failed: "failed";
    }>;
    lastError: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
