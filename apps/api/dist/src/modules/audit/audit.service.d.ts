import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    list(user: AuthUser, filters: {
        entityType?: string;
        entityId?: string;
        actorUserId?: string;
        actorDeviceId?: string;
        from?: Date;
        to?: Date;
        skip?: number;
        take?: number;
    }): Promise<{
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
