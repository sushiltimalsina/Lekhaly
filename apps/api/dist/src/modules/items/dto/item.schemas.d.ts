import { z } from "zod";
export declare const CreateItemSchema: z.ZodObject<{
    name: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
    salesPrice: z.ZodOptional<z.ZodNumber>;
    purchasePrice: z.ZodOptional<z.ZodNumber>;
    incomeAccountId: z.ZodOptional<z.ZodString>;
    expenseAccountId: z.ZodOptional<z.ZodString>;
    taxCodeId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateItemSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    unit: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    salesPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    purchasePrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    incomeAccountId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    expenseAccountId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxCodeId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ListItemQuerySchema: z.ZodObject<{
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
