import { z } from "zod";

export const CreateSaleTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
});

export const ListSaleTypeQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  take: z.coerce.number().max(100).default(50),
});

export const ReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  }),
);
