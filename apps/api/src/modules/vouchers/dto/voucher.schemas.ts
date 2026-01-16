import { z } from "zod";

export const VoucherLineSchema = z.object({
  accountId: z.string().uuid(),
  partyId: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  description: z.string().trim().max(255).optional(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  taxCodeId: z.string().uuid().optional(),
  taxAmount: z.number().nonnegative().default(0)
});

export const CreateVoucherDraftSchema = z.object({
  voucherType: z.enum(["sales_invoice", "receipt", "payment", "journal", "opening", "reversal"]),
  voucherDate: z.coerce.date(),
  partyId: z.string().uuid().optional(),
  memo: z.string().trim().max(500).optional(),
  lines: z.array(VoucherLineSchema).min(1)
});

export const UpdateVoucherDraftSchema = CreateVoucherDraftSchema.partial().extend({
  lines: z.array(VoucherLineSchema).min(1).optional()
});
