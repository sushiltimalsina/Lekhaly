import { z } from "zod";
export declare const CreateItemGroupSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const ListItemGroupQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
