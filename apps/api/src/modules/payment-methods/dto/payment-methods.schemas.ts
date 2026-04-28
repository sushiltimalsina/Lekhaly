import { z } from "zod";

export const CreatePaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
});

export const ListPaymentMethodQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  take: z.coerce.number().max(100).default(50),
});
