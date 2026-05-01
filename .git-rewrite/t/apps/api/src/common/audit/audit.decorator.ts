import { SetMetadata } from "@nestjs/common";

export const AUDIT_KEY = "auditMeta";

export type AuditMeta = {
  entityType?: string;
  idParam?: string;
};

export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_KEY, meta);
