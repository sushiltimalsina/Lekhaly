import { z } from "zod";

export const ReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const PartyAgingQuerySchema = ReportQuerySchema.extend({
  asOf: z.coerce.date().optional()
});

export const ExportReportSchema = z.object({
  report: z.enum(["trial-balance", "profit-loss", "balance-sheet"]),
  format: z.enum(["pdf", "csv"]).default("pdf"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
