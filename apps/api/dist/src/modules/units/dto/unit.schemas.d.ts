import { z } from "zod";
export declare const CreateUnitSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const ListUnitQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const ReorderSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    sortOrder: z.ZodNumber;
}, z.core.$strip>>;
