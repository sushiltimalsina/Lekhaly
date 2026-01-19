import { z } from "zod";
export declare const CreateVoucherAttachmentSchema: z.ZodObject<{
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodCoercedNumber<unknown>;
    storageKey: z.ZodString;
}, z.core.$strip>;
