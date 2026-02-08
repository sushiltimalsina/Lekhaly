import { z } from "zod";

export const PurchaseOrderItemSchema = z.object({
    itemId: z.string().uuid().optional(),
    description: z.string().trim().max(255).optional(),
    qty: z.number().positive(),
    rate: z.number().nonnegative(),
    taxCodeId: z.string().uuid().optional(),
});

export const CreatePurchaseOrderSchema = z.object({
    partyId: z.string().uuid(),
    orderDate: z.coerce.date().optional(),
    orderDateBs: z.string().trim().max(20).optional(),
    expectedDelivery: z.coerce.date().optional(),
    expectedDeliveryBs: z.string().trim().max(20).optional(),
    memo: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
    terms: z.string().trim().max(5000).optional(),
    items: z.array(PurchaseOrderItemSchema).min(1),
    sundries: z.array(z.object({
        billSundryId: z.string().uuid().optional(),
        name: z.string().min(1),
        type: z.enum(["add", "less"]),
        rate: z.number().optional().nullable(),
        amount: z.number()
    })).optional()
}).superRefine((data, ctx) => {
    if (!data.orderDate && !data.orderDateBs) {
        ctx.addIssue({ code: "custom", message: "orderDate or orderDateBs is required", path: ["orderDate"] });
    }
});

export const PurchaseOrderListQuerySchema = z.object({
    status: z.enum(["draft", "open", "fulfilled", "cancelled"]).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    q: z.string().trim().max(200).optional(),
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(200).optional()
});
