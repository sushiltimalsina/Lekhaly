import { z } from "zod";

const AccountFields = z.object({
  code: z.string().trim().min(2).max(16).optional(),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  parentId: z.string().uuid().nullish(),
  isGroup: z.boolean().optional(),
  isPostable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isContra: z.boolean().optional()
});

export const CreateAccountSchema = AccountFields.refine(
  account => account.isContra !== true || account.type === "income" || account.type === "expense",
  { message: "Contra accounts must be income or expense accounts", path: ["isContra"] }
);

export const UpdateAccountSchema = AccountFields.partial().refine(
  account => account.isContra !== true || account.type === undefined || account.type === "income" || account.type === "expense",
  { message: "Contra accounts must be income or expense accounts", path: ["isContra"] }
);

export const ListAccountQuerySchema = z.object({
  type: z.enum(["asset", "liability", "equity", "income", "expense"]).optional(),
  isActive: z.coerce.boolean().optional(),
  q: z.string().trim().max(120).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});
