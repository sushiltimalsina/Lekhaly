import { z } from "zod";

export const BillSundrySchema = z.object({
    name: z.string().min(1),
    type: z.enum(["add", "less"]),
    rate: z.number().optional().nullable(),
    accountId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional()
});

export const BillSundryListQuerySchema = z.object({
    isActive: z.preprocess((v) => v === "true" ? true : v === "false" ? false : undefined, z.boolean().optional()),
    q: z.string().optional(),
    take: z.preprocess((v) => (v ? parseInt(v as string, 10) : undefined), z.number().optional()),
    skip: z.preprocess((v) => (v ? parseInt(v as string, 10) : undefined), z.number().optional())
});

export const ReorderSchema = z.array(
    z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int(),
    }),
);
