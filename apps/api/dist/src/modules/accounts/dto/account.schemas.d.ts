import { z } from "zod";
export declare const CreateAccountSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<{
        expense: "expense";
        asset: "asset";
        liability: "liability";
        equity: "equity";
        income: "income";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    isPostable: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateAccountSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        expense: "expense";
        asset: "asset";
        liability: "liability";
        equity: "equity";
        income: "income";
    }>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isPostable: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const ListAccountQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        expense: "expense";
        asset: "asset";
        liability: "liability";
        equity: "equity";
        income: "income";
    }>>;
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
