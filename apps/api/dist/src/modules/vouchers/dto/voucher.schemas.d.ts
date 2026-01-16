import { z } from "zod";
export declare const VoucherLineSchema: z.ZodObject<{
    accountId: z.ZodString;
    partyId: z.ZodOptional<z.ZodString>;
    itemId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    debit: z.ZodDefault<z.ZodNumber>;
    credit: z.ZodDefault<z.ZodNumber>;
    taxCodeId: z.ZodOptional<z.ZodString>;
    taxAmount: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const CreateVoucherDraftSchema: z.ZodObject<{
    voucherType: z.ZodEnum<{
        sales_invoice: "sales_invoice";
        receipt: "receipt";
        payment: "payment";
        journal: "journal";
        opening: "opening";
        reversal: "reversal";
    }>;
    voucherDate: z.ZodCoercedDate<unknown>;
    partyId: z.ZodOptional<z.ZodString>;
    memo: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodObject<{
        accountId: z.ZodString;
        partyId: z.ZodOptional<z.ZodString>;
        itemId: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        debit: z.ZodDefault<z.ZodNumber>;
        credit: z.ZodDefault<z.ZodNumber>;
        taxCodeId: z.ZodOptional<z.ZodString>;
        taxAmount: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const UpdateVoucherDraftSchema: z.ZodObject<{
    voucherType: z.ZodOptional<z.ZodEnum<{
        sales_invoice: "sales_invoice";
        receipt: "receipt";
        payment: "payment";
        journal: "journal";
        opening: "opening";
        reversal: "reversal";
    }>>;
    voucherDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    partyId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    memo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lines: z.ZodOptional<z.ZodArray<z.ZodObject<{
        accountId: z.ZodString;
        partyId: z.ZodOptional<z.ZodString>;
        itemId: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        debit: z.ZodDefault<z.ZodNumber>;
        credit: z.ZodDefault<z.ZodNumber>;
        taxCodeId: z.ZodOptional<z.ZodString>;
        taxAmount: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
