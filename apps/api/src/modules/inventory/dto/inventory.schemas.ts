import { z } from "zod";

export const StockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  date: z.coerce.date().optional(),
  dateBs: z.string().trim().max(20).optional(),
  qty: z.number(),
  rate: z.number().nonnegative().optional(),
  accountId: z.string().uuid(),
  memo: z.string().trim().max(255).optional()
}).superRefine((data, ctx) => {
  if (!data.date && !data.dateBs) {
    ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
  }
});

export const StockQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
