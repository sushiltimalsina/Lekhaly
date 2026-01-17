export declare const AUDIT_KEY = "auditMeta";
export type AuditMeta = {
    entityType?: string;
    idParam?: string;
};
export declare const Audit: (meta: AuditMeta) => import("@nestjs/common").CustomDecorator<string>;
