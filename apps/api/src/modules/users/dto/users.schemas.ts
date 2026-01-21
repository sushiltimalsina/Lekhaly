import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(100).optional(),
  password: z.string().min(8).max(128),
  roleIds: z.array(z.string().uuid()).optional()
});

export const UpdateUserSchema = z.object({
  name: z.string().trim().max(100).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  roleIds: z.array(z.string().uuid()).optional()
});

export const UserListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});
