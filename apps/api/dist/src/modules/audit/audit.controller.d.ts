import type { AuthUser } from "../../common/auth/auth.types";
import { AuditService } from "./audit.service";
export declare class AuditController {
    private audit;
    constructor(audit: AuditService);
    list(user: AuthUser, query: any): Promise<{
        rows: ({
            actorUser: {
                id: string;
                email: string;
                name: string | null;
            } | null;
            actorDevice: {
                id: string;
                label: string;
                platform: string;
            } | null;
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            entityType: string;
            entityId: string;
            actorType: import("@prisma/client").$Enums.AuditActorType;
            action: string;
            requestId: string | null;
            ip: string | null;
            userAgent: string | null;
            actorUserId: string | null;
            actorDeviceId: string | null;
            beforeSnapshotId: string | null;
            afterSnapshotId: string | null;
        })[];
        nextCursor: {
            cursorId: string;
            cursorCreatedAt: Date;
        } | null;
    }>;
    export(user: AuthUser, query: any): Promise<{
        format: string;
        fileName: string;
        contentType: string;
        contentBase64: string;
    }>;
}
