import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class OutboxService {
    private prisma;
    constructor(prisma: PrismaService);
    list(user: AuthUser, filters: {
        status?: "pending" | "processed" | "failed";
        type?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.OutboxStatus;
        createdAt: Date;
        type: string;
        payload: Prisma.JsonValue;
        processedAt: Date | null;
        lastError: string | null;
        attempts: number;
        nextAttemptAt: Date | null;
    }[]>;
    ack(user: AuthUser, id: string, input: {
        status: "processed" | "failed";
        lastError?: string;
    }): Promise<{
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.OutboxStatus;
        createdAt: Date;
        type: string;
        payload: Prisma.JsonValue;
        processedAt: Date | null;
        lastError: string | null;
        attempts: number;
        nextAttemptAt: Date | null;
    }>;
    enqueue(companyId: string, type: string, payload: Prisma.InputJsonValue): Promise<{
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.OutboxStatus;
        createdAt: Date;
        type: string;
        payload: Prisma.JsonValue;
        processedAt: Date | null;
        lastError: string | null;
        attempts: number;
        nextAttemptAt: Date | null;
    }>;
}
