import { z } from "zod";

export const CreateProformaSchema = z.object({
  deviceId: z.string().uuid(),
  voucherType: z.enum([
    "sales_invoice",
    "sales_return",
    "purchase",
    "purchase_return",
    "receipt",
    "payment",
    "journal",
    "opening",
    "reversal"
  ]),
  payload: z.object({
    voucherDate: z.string().optional(),
    voucherDateBs: z.string().optional(),
    partyId: z.string().uuid().optional(),
    memo: z.string().optional(),
    lines: z.array(z.object({
      accountId: z.string().uuid(),
      partyId: z.string().uuid().optional(),
      itemId: z.string().uuid().optional(),
      description: z.string().optional(),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
      taxCodeId: z.string().uuid().optional(),
      taxAmount: z.number().optional(),
      qty: z.number().optional(),
      rate: z.number().optional(),
    })).min(1),
  }),
  memo: z.string().optional(),
});

export const ConvertProformaSchema = z.object({
  idempotencyKey: z.string().max(128).optional(),
});

export const ListProformaQuerySchema = z.object({
  converted: z.enum(["true", "false", "all"]).default("false"),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});
