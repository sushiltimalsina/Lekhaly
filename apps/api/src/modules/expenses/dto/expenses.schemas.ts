import { z } from "zod";

export const ExpenseDraftSchema = z.object({
  date: z.coerce.date(),
  vendorId: z.string().uuid().optional(),
  amount: z.number().positive(),
  taxCodeId: z.string().uuid().optional(),
  description: z.string().trim().max(255).optional(),
  attachmentId: z.string().uuid().optional(),
  expenseAccountId: z.string().uuid(),
  paymentAccountId: z.string().uuid()
});

export const ExpenseListQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(["draft", "posted", "void"]).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});
