import { z } from "zod";

export const RegisterDeviceSchema = z.object({
  label: z.string().trim().min(2).max(64),
  platform: z.enum(["windows", "mac", "linux", "web"])
});

export const PushChangeSchema = z.object({
  deviceId: z.string().uuid(),
  entries: z
    .array(
      z.object({
        seq: z.coerce.number().int().min(1),
        entityType: z.string().trim().min(1).max(64),
        entityId: z.string().trim().min(1).max(128),
        op: z.enum(["upsert", "delete", "command"]),
        payload: z.any(),
        idempotencyKey: z.string().trim().max(128).optional()
      })
    )
    .min(1)
});

export const PullQuerySchema = z.object({
  deviceId: z.string().uuid(),
  since: z.coerce.date().optional(),
  take: z.coerce.number().int().min(1).max(500).optional()
});
