import { z } from "zod";

export const CreateItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().max(64).optional(),
  hsCode: z.string().trim().max(32).optional(),
  unit: z.string().trim().max(32).optional(),
  type: z.enum(["goods", "services"]).optional(),
  salesPrice: z.number().nonnegative().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  incomeAccountId: z.string().uuid().optional(),
  expenseAccountId: z.string().uuid().optional(),
  taxCodeId: z.string().uuid().optional()
});

export const UpdateItemSchema = CreateItemSchema.partial().extend({
  isActive: z.boolean().optional()
});

export const ListItemQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  q: z.string().trim().max(120).optional(),
  type: z.enum(["goods", "services"]).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional()
});
