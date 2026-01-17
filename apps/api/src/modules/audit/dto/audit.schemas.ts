import { z } from "zod";

export const AuditQuerySchema = z.object({
  entityType: z.string().trim().max(64).optional(),
  entityId: z.string().trim().max(128).optional(),
  actorUserId: z.string().uuid().optional(),
  actorDeviceId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});
