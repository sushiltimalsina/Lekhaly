import { z } from "zod";

export const OutboxListQuerySchema = z.object({
  status: z.enum(["pending", "processed", "failed"]).optional(),
  type: z.string().trim().max(128).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});

export const OutboxAckSchema = z.object({
  status: z.enum(["processed", "failed"]),
  lastError: z.string().trim().max(500).optional()
});
