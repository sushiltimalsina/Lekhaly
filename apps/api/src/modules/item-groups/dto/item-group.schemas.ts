import { z } from "zod";

export const CreateItemGroupSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export const ListItemGroupQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});

export const ReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  }),
);

