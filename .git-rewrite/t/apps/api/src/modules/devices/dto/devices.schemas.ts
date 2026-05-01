import { z } from "zod";

export const DeviceListQuerySchema = z.object({
  trusted: z.coerce.boolean().optional(),
  q: z.string().trim().max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});

export const DeviceTrustSchema = z.object({
  trusted: z.coerce.boolean()
});
