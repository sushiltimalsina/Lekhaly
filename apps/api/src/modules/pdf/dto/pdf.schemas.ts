import { z } from "zod";

export const PdfInvoiceSchema = z.object({
  invoiceId: z.string().uuid()
});

export const PdfVoucherSchema = z.object({
  voucherId: z.string().uuid()
});

export const PdfLedgerSchema = z.object({
  partyId: z.string().uuid(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
