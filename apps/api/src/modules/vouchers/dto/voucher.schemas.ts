import { z } from "zod";

export const VoucherLineSchema = z.object({
  accountId: z.string().uuid(),
  partyId: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  description: z.string().trim().max(255).optional(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  qty: z.coerce.number().default(0),
  taxCodeId: z.string().uuid().optional(),
  taxAmount: z.number().nonnegative().default(0),
  warehouseId: z.string().uuid().optional().nullable(),
  binId: z.string().uuid().optional().nullable(),
  batchNo: z.string().trim().max(120).optional(),
  lotNo: z.string().trim().max(120).optional(),
  expiryDate: z.coerce.date().optional(),
  expiryDateBs: z.string().trim().max(20).optional(),
  serialNumbers: z.array(z.string().trim().min(1).max(120)).optional()
}).superRefine((data, ctx) => {
  if (data.taxCodeId && (!data.taxAmount || data.taxAmount <= 0)) {
    ctx.addIssue({ code: "custom", message: "Tax amount required when tax code is set", path: ["taxAmount"] });
  }
});

const VoucherDraftBaseSchema = z.object({
  voucherType: z.enum([
    "sales_invoice",
    "sales_return",
    "purchase",
    "purchase_return",
    "receipt",
    "payment",
    "journal",
    "opening",
    "reversal",
    "contra"
  ]),
  voucherDate: z.coerce.date().optional(),
  voucherDateBs: z.string().trim().max(20).optional(),
  referenceNo: z.string().trim().max(100).optional(),
  vendorInvoiceNo: z.string().trim().max(100).optional(),
  vendorInvoiceDate: z.coerce.date().optional(),
  partyId: z.string().uuid().optional(),
  memo: z.string().trim().max(500).optional(),
  additionalNote: z.string().trim().max(2000).optional(),
  lines: z.array(VoucherLineSchema).min(1)
});

export const CreateVoucherDraftSchema = VoucherDraftBaseSchema.superRefine((data, ctx) => {
  if (!data.voucherDate && !data.voucherDateBs) {
    ctx.addIssue({ code: "custom", message: "voucherDate or voucherDateBs is required", path: ["voucherDate"] });
  }
  const requiresParty = ["sales_invoice", "sales_return", "purchase", "purchase_return"];
  const forbidsParty = ["journal", "opening", "reversal", "contra"];
  if (requiresParty.includes(data.voucherType) && !data.partyId) {
    ctx.addIssue({ code: "custom", message: "Party is required for this voucher type", path: ["partyId"] });
  }
  if (forbidsParty.includes(data.voucherType) && data.partyId) {
    ctx.addIssue({ code: "custom", message: "Party is not allowed for this voucher type", path: ["partyId"] });
  }
});

export const UpdateVoucherDraftSchema = VoucherDraftBaseSchema.partial().extend({
  lines: z.array(VoucherLineSchema).min(1).optional()
});

export const ListVoucherQuerySchema = z.object({
  status: z.enum(["draft", "posted", "void"]).optional(),
  voucherType: z.enum([
    "sales_invoice",
    "sales_return",
    "purchase",
    "purchase_return",
    "receipt",
    "payment",
    "journal",
    "opening",
    "reversal",
    "contra"
  ]).optional(),
  partyId: z.string().uuid().optional(),
  createdByUserId: z.string().uuid().optional(),
  postedByUserId: z.string().uuid().optional(),
  voidedByUserId: z.string().uuid().optional(),
  voucherNumber: z.string().trim().max(64).optional(),
  memo: z.string().trim().max(200).optional(),
  q: z.string().trim().max(200).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(100).optional()
});
