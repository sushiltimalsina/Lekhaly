import { z } from "zod";
export declare const AuditQuerySchema: z.ZodObject<{
    entityType: z.ZodOptional<z.ZodString>;
    entityId: z.ZodOptional<z.ZodString>;
    actorUserId: z.ZodOptional<z.ZodString>;
    actorDeviceId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    cursorId: z.ZodOptional<z.ZodString>;
    cursorCreatedAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const AuditExportSchema: z.ZodObject<{
    entityType: z.ZodOptional<z.ZodString>;
    entityId: z.ZodOptional<z.ZodString>;
    actorUserId: z.ZodOptional<z.ZodString>;
    actorDeviceId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    cursorId: z.ZodOptional<z.ZodString>;
    cursorCreatedAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    format: z.ZodDefault<z.ZodEnum<{
        csv: "csv";
    }>>;
}, z.core.$strip>;
