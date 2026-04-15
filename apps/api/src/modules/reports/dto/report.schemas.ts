import { z } from "zod";

export const ReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  fromBs: z.string().trim().max(20).optional(),
  to: z.coerce.date().optional(),
  toBs: z.string().trim().max(20).optional()
});

export const PartyAgingQuerySchema = ReportQuerySchema.extend({
  asOf: z.coerce.date().optional(),
  asOfBs: z.string().trim().max(20).optional()
});

export const LedgerQuerySchema = z
  .object({
    accountId: z.string().uuid().optional(),
    partyId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    fromBs: z.string().trim().max(20).optional(),
    to: z.coerce.date().optional(),
    toBs: z.string().trim().max(20).optional()
  })
  .refine((value) => !!value.accountId || !!value.partyId, {
    message: "Either accountId or partyId is required."
  });

export const ExportReportSchema = z.object({
  report: z.enum(["trial-balance", "profit-loss", "balance-sheet"]),
  format: z.enum(["pdf", "csv"]).default("pdf"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
