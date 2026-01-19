import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class SyncService {
    private prisma;
    constructor(prisma: PrismaService);
    private requireDeviceAccess;
    registerDevice(user: AuthUser, dto: {
        label: string;
        platform: string;
    }): Promise<{
        deviceId: string;
    }>;
    pushChanges(user: AuthUser, dto: {
        deviceId: string;
        entries: Array<{
            seq: number;
            entityType: string;
            entityId: string;
            op: "upsert" | "delete" | "command";
            payload: Prisma.InputJsonValue;
            idempotencyKey?: string;
        }>;
    }): Promise<{
        accepted: number;
        rejected: number;
        conflicts: {
            seq: number;
            reason: string;
        }[];
    }>;
    pullChanges(user: AuthUser, query: {
        deviceId: string;
        since?: Date;
        lastChangeId?: string;
        take?: number;
    }): Promise<{
        entries: {
            seq: string;
            id: string;
            companyId: string;
            createdAt: Date;
            entityType: string;
            entityId: string;
            deviceId: string;
            actorUserId: string | null;
            payload: Prisma.JsonValue;
            op: import("@prisma/client").$Enums.ChangeOp;
            idempotencyKey: string | null;
        }[];
    }>;
}
