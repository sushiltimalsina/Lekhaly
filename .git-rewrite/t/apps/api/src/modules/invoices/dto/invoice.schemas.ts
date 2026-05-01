import { z } from "zod";

export const InvoiceItemSchema = z.object({
  itemId: z.string().uuid().optional(),
  description: z.string().trim().max(255).optional(),
  qty: z.number().positive(),
  rate: z.number().nonnegative(),
  taxCodeId: z.string().uuid().optional(),
  taxCodeIds: z.array(z.string().uuid()).optional()
});

export const CreateInvoiceDraftSchema = z.object({
  type: z.enum(["sales", "sales_return"]),
  partyId: z.string().uuid(),
  date: z.coerce.date().optional(),
  dateBs: z.string().trim().max(20).optional(),
  dueDate: z.coerce.date().optional(),
  dueDateBs: z.string().trim().max(20).optional(),
  receivableAccountId: z.string().uuid(),
  items: z.array(InvoiceItemSchema).min(1),
  sundries: z.array(z.object({
    billSundryId: z.string().uuid().optional(),
    name: z.string().min(1),
    type: z.enum(["add", "less"]),
    rate: z.number().optional().nullable(),
    amount: z.number()
  })).optional()
}).superRefine((data, ctx) => {
  if (!data.date && !data.dateBs) {
    ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
  }
});

export const InvoiceListQuerySchema = z.object({
  type: z.enum(["sales", "sales_return"]).optional(),
  status: z.enum(["draft", "posted", "void"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});
