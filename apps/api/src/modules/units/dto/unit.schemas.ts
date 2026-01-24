import { z } from "zod";

export const CreateUnitSchema = z.object({
  name: z.string().trim().min(1).max(50)
});

export const ListUnitQuerySchema = z.object({
  q: z.string().trim().max(50).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});

