import { z } from "zod";

export const CreatePaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
});

export const ListPaymentMethodQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  take: z.coerce.number().max(100).default(50),
});

export const ReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  }),
);
