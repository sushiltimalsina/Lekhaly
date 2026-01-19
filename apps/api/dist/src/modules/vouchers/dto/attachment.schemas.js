"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVoucherAttachmentSchema = void 0;
const zod_1 = require("zod");
exports.CreateVoucherAttachmentSchema = zod_1.z.object({
    fileName: zod_1.z.string().trim().max(255),
    mimeType: zod_1.z.string().trim().max(128),
    sizeBytes: zod_1.z.coerce.number().int().min(1).max(50 * 1024 * 1024),
    storageKey: zod_1.z.string().trim().max(512)
});
//# sourceMappingURL=attachment.schemas.js.map