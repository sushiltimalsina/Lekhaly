import { z } from "zod";
export declare const PdfInvoiceSchema: z.ZodObject<{
    invoiceId: z.ZodString;
}, z.core.$strip>;
export declare const PdfVoucherSchema: z.ZodObject<{
    voucherId: z.ZodString;
}, z.core.$strip>;
export declare const PdfLedgerSchema: z.ZodObject<{
    partyId: z.ZodString;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
