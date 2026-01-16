import { z } from "zod";

export const ReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});
