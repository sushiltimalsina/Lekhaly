import { z } from "zod";

export const QuotationItemSchema = z.object({
    itemId: z.string().uuid().optional(),
    description: z.string().trim().max(255).optional(),
    qty: z.number().positive(),
    rate: z.number().nonnegative(),
    taxCodeId: z.string().uuid().optional(),
});

export const CreateQuotationSchema = z.object({
    partyId: z.string().uuid(),
    quotationDate: z.coerce.date().optional(),
    quotationDateBs: z.string().trim().max(20).optional(),
    expiryDate: z.coerce.date().optional(),
    expiryDateBs: z.string().trim().max(20).optional(),
    referenceNo: z.string().trim().max(100).optional(),
    memo: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
    terms: z.string().trim().max(5000).optional(),
    items: z.array(QuotationItemSchema).min(1),
    sundries: z.array(z.object({
        billSundryId: z.string().uuid().optional(),
        name: z.string().min(1),
        type: z.enum(["add", "less"]),
        rate: z.number().optional().nullable(),
        amount: z.number()
    })).optional()
}).superRefine((data, ctx) => {
    if (!data.quotationDate && !data.quotationDateBs) {
        ctx.addIssue({ code: "custom", message: "quotationDate or quotationDateBs is required", path: ["quotationDate"] });
    }
});

export const QuotationListQuerySchema = z.object({
    status: z.enum(["draft", "sent", "accepted", "declined", "expired"]).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    q: z.string().trim().max(200).optional(),
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(200).optional()
});
