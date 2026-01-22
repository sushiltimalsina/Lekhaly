import { z } from "zod";
export declare const ExpenseDraftSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    vendorId: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    taxCodeId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    attachmentId: z.ZodOptional<z.ZodString>;
    expenseAccountId: z.ZodString;
    paymentAccountId: z.ZodString;
}, z.core.$strip>;
export declare const ExpenseListQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        posted: "posted";
        void: "void";
    }>>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
