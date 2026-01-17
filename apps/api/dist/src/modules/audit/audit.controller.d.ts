import type { AuthUser } from "../../common/auth/auth.types";
import { AuditService } from "./audit.service";
export declare class AuditController {
    private audit;
    constructor(audit: AuditService);
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        actorType: import("@prisma/client").$Enums.AuditActorType;
        action: string;
        entityType: string;
        entityId: string;
        requestId: string | null;
        ip: string | null;
        userAgent: string | null;
        actorUserId: string | null;
        actorDeviceId: string | null;
        beforeSnapshotId: string | null;
        afterSnapshotId: string | null;
    }[]>;
}
