import { z } from "zod";

export const CreateFiscalSessionSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().transform((v) => new Date(v)),
  endDate: z.string().transform((v) => new Date(v)),
  isCurrent: z.boolean().optional().default(false),
  
  // Optional template overrides
  invoicePrefix: z.string().optional(),
  purchasePrefix: z.string().optional(),
  salesReturnPrefix: z.string().optional(),
  purchaseReturnPrefix: z.string().optional(),
  orderPrefix: z.string().optional(),
  quotationPrefix: z.string().optional(),
  purchaseOrderPrefix: z.string().optional(),
  receiptPrefix: z.string().optional(),
  paymentPrefix: z.string().optional(),
  journalPrefix: z.string().optional(),

  invoiceSuffix: z.string().optional(),
  purchaseSuffix: z.string().optional(),
  salesReturnSuffix: z.string().optional(),
  purchaseReturnSuffix: z.string().optional(),
  orderSuffix: z.string().optional(),
  quotationSuffix: z.string().optional(),
  purchaseOrderSuffix: z.string().optional(),
  receiptSuffix: z.string().optional(),
  paymentSuffix: z.string().optional(),
  journalSuffix: z.string().optional(),
});
