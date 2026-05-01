import { z } from "zod";

export const CreateAccountSchema = z.object({
  code: z.string().trim().min(2).max(16),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  parentId: z.string().uuid().optional(),
  isPostable: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

export const ListAccountQuerySchema = z.object({
  type: z.enum(["asset", "liability", "equity", "income", "expense"]).optional(),
  isActive: z.coerce.boolean().optional(),
  q: z.string().trim().max(120).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});
