import { z } from "zod";
export declare const InvoiceItemSchema: z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    qty: z.ZodNumber;
    rate: z.ZodNumber;
    taxCodeId: z.ZodOptional<z.ZodString>;
    taxCodeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const CreateInvoiceDraftSchema: z.ZodObject<{
    type: z.ZodEnum<{
        sales_return: "sales_return";
        sales: "sales";
    }>;
    partyId: z.ZodString;
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dueDateBs: z.ZodOptional<z.ZodString>;
    referenceNo: z.ZodOptional<z.ZodString>;
    receivableAccountId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        qty: z.ZodNumber;
        rate: z.ZodNumber;
        taxCodeId: z.ZodOptional<z.ZodString>;
        taxCodeIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    sundries: z.ZodOptional<z.ZodArray<z.ZodObject<{
        billSundryId: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        type: z.ZodEnum<{
            less: "less";
            add: "add";
        }>;
        rate: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        amount: z.ZodNumber;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const InvoiceListQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        sales_return: "sales_return";
        sales: "sales";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        posted: "posted";
        void: "void";
    }>>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
