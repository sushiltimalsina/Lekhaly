import { z } from "zod";

export const StockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  date: z.coerce.date(),
  qty: z.number(),
  rate: z.number().nonnegative().optional(),
  accountId: z.string().uuid(),
  memo: z.string().trim().max(255).optional()
});

export const StockQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
