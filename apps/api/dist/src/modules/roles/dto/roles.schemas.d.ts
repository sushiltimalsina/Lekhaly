import { z } from "zod";
export declare const CreateRoleSchema: z.ZodObject<{
    name: z.ZodString;
    permissionCodes: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateRoleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    permissionCodes: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const RoleListQuerySchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const AssignRoleUserSchema: z.ZodObject<{
    userId: z.ZodString;
}, z.core.$strip>;
export declare const ReorderSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    sortOrder: z.ZodNumber;
}, z.core.$strip>>;
