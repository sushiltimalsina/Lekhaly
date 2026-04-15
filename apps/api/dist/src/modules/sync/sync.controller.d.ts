import type { AuthUser } from "../../common/auth/auth.types";
import { SyncService } from "./sync.service";
export declare class SyncController {
    private sync;
    constructor(sync: SyncService);
    register(user: AuthUser, body: any): Promise<{
        deviceId: string;
        proformaPrefix: string;
    }>;
    nextNumber(user: AuthUser, body: any): Promise<{
        prefix: string;
        number: number;
        voucherNumber: string;
    }>;
    ping(): {
        ok: boolean;
        ts: number;
    };
    push(user: AuthUser, body: any): Promise<{
        accepted: number;
        rejected: number;
        conflicts: {
            seq: number;
            reason: string;
        }[];
    }>;
    pull(user: AuthUser, query: any): Promise<{
        entries: {
            seq: string;
            id: string;
            companyId: string;
            createdAt: Date;
            entityType: string;
            entityId: string;
            deviceId: string;
            actorUserId: string | null;
            payload: import("@prisma/client/runtime/client").JsonValue;
            op: import("@prisma/client").$Enums.ChangeOp;
            idempotencyKey: string | null;
        }[];
    }>;
}
