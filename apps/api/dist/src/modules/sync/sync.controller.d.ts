import type { AuthUser } from "../../common/auth/auth.types";
import { SyncService } from "./sync.service";
export declare class SyncController {
    private sync;
    constructor(sync: SyncService);
    register(user: AuthUser, body: any): Promise<{
        deviceId: string;
    }>;
    push(user: AuthUser, body: any): Promise<{
        accepted: number;
        conflicts: number;
    }>;
    pull(user: AuthUser, query: any): Promise<{
        entries: {
            seq: string;
            id: string;
            companyId: string;
            createdAt: Date;
            entityType: string;
            entityId: string;
            actorUserId: string | null;
            deviceId: string;
            op: import("@prisma/client").$Enums.ChangeOp;
            payload: import("@prisma/client/runtime/client").JsonValue;
            idempotencyKey: string | null;
        }[];
    }>;
}
