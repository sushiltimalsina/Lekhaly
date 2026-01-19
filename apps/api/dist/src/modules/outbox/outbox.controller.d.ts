import type { AuthUser } from "../../common/auth/auth.types";
import { OutboxService } from "./outbox.service";
export declare class OutboxController {
    private outbox;
    constructor(outbox: OutboxService);
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.OutboxStatus;
        createdAt: Date;
        type: string;
        lastError: string | null;
        payload: import("@prisma/client/runtime/client").JsonValue;
        processedAt: Date | null;
        attempts: number;
        nextAttemptAt: Date | null;
    }[]>;
    ack(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.OutboxStatus;
        createdAt: Date;
        type: string;
        lastError: string | null;
        payload: import("@prisma/client/runtime/client").JsonValue;
        processedAt: Date | null;
        attempts: number;
        nextAttemptAt: Date | null;
    }>;
}
