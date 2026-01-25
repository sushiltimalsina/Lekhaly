import { z } from "zod";
export declare const CreateItemSchema: z.ZodObject<{
    name: z.ZodString;
    sku: z.ZodOptional<z.ZodString>;
    hsCode: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        goods: "goods";
        services: "services";
    }>>;
    salesPrice: z.ZodOptional<z.ZodNumber>;
    purchasePrice: z.ZodOptional<z.ZodNumber>;
    openingQty: z.ZodOptional<z.ZodNumber>;
    openingPrice: z.ZodOptional<z.ZodNumber>;
    groupId: z.ZodOptional<z.ZodString>;
    incomeAccountId: z.ZodOptional<z.ZodString>;
    expenseAccountId: z.ZodOptional<z.ZodString>;
    taxCodeId: z.ZodOptional<z.ZodString>;
    taxCodeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const UpdateItemSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    hsCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    unit: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        goods: "goods";
        services: "services";
    }>>>;
    salesPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    purchasePrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    openingQty: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    openingPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    groupId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    incomeAccountId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    expenseAccountId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxCodeId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxCodeIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ListItemQuerySchema: z.ZodObject<{
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        goods: "goods";
        services: "services";
    }>>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
