import { z } from "zod";

export const CreateWarehouseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  code: z.string().trim().max(20).optional(),
});

export const UpdateWarehouseSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  code: z.string().trim().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const CreateBinSchema = z.object({
  name: z.string().trim().min(1, "Bin name is required").max(100),
  code: z.string().trim().max(20).optional(),
});

export const UpdateBinSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  code: z.string().trim().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const WarehouseListQuerySchema = z.object({
  isActive: z.preprocess(
    (v) => (v === "true" ? true : v === "false" ? false : undefined),
    z.boolean().optional()
  ),
  q: z.string().trim().optional(),
});

export const ReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  }),
);
