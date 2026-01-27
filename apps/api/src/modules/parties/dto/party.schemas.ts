import { z } from "zod";

export const CreatePartySchema = z.object({
  type: z.enum(["customer", "supplier", "both"]).default("customer"),
  name: z.string().trim().min(2).max(120),
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
  panNumber: z.string().trim().max(40).optional(),
  vatNumber: z.string().trim().max(40).optional()
});

export const UpdatePartySchema = CreatePartySchema.partial().extend({
  isActive: z.boolean().optional()
});

export const ListPartyQuerySchema = z.object({
  type: z.enum(["customer", "supplier", "both"]).optional(),
  isActive: z.coerce.boolean().optional(),
  q: z.string().trim().max(120).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(1000).optional()
});
