import { z } from "zod";
export declare const RegisterDeviceSchema: z.ZodObject<{
    label: z.ZodString;
    platform: z.ZodEnum<{
        web: "web";
        windows: "windows";
        mac: "mac";
        linux: "linux";
    }>;
}, z.core.$strip>;
export declare const PushChangeSchema: z.ZodObject<{
    deviceId: z.ZodString;
    entries: z.ZodArray<z.ZodObject<{
        seq: z.ZodCoercedNumber<unknown>;
        entityType: z.ZodString;
        entityId: z.ZodString;
        op: z.ZodEnum<{
            delete: "delete";
            upsert: "upsert";
            command: "command";
        }>;
        payload: z.ZodAny;
        idempotencyKey: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const PullQuerySchema: z.ZodObject<{
    deviceId: z.ZodString;
    since: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    lastChangeId: z.ZodOptional<z.ZodString>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const NextNumberSchema: z.ZodObject<{
    deviceId: z.ZodString;
    voucherType: z.ZodEnum<{
        sales_invoice: "sales_invoice";
        sales_return: "sales_return";
        purchase: "purchase";
        purchase_return: "purchase_return";
        receipt: "receipt";
        payment: "payment";
        journal: "journal";
        opening: "opening";
        reversal: "reversal";
    }>;
}, z.core.$strip>;
