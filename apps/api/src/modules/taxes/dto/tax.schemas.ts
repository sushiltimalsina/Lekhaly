import { z } from "zod";

export const TaxCodeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  rate: z.number().min(0).max(100),
  isInclusive: z.boolean().optional(),
  inputTaxAccountId: z.string().uuid().optional(),
  outputTaxAccountId: z.string().uuid().optional()
});

export const TaxListQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  q: z.string().trim().max(100).optional()
});

export const VatReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  fromBs: z.string().trim().max(20).optional(),
  to: z.coerce.date().optional(),
  toBs: z.string().trim().max(20).optional()
});
