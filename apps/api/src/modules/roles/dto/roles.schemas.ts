import { z } from "zod";

export const CreateRoleSchema = z.object({
  name: z.string().trim().min(2).max(64),
  permissionCodes: z.array(z.string().trim().min(1)).min(1)
});

export const UpdateRoleSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  permissionCodes: z.array(z.string().trim().min(1)).optional()
});

export const RoleListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});

export const AssignRoleUserSchema = z.object({
  userId: z.string().uuid()
});

export const ReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  }),
);
