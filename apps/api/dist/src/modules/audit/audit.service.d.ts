import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    private toCsv;
    list(user: AuthUser, filters: {
        entityType?: string;
        entityId?: string;
        actorUserId?: string;
        actorDeviceId?: string;
        q?: string;
        from?: Date;
        to?: Date;
        cursorId?: string;
        cursorCreatedAt?: Date;
        skip?: number;
        take?: number;
    }): Promise<{
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
    exportCsv(user: AuthUser, filters: {
        entityType?: string;
        entityId?: string;
        actorUserId?: string;
        actorDeviceId?: string;
        q?: string;
        from?: Date;
        to?: Date;
    }): Promise<{
        format: string;
        fileName: string;
        contentType: string;
        contentBase64: string;
    }>;
}
