import { z } from "zod";

export const CreateVoucherAttachmentSchema = z.object({
  fileName: z.string().trim().max(255),
  mimeType: z.string().trim().max(128),
  sizeBytes: z.coerce.number().int().min(1).max(50 * 1024 * 1024),
  storageKey: z.string().trim().max(512)
});
