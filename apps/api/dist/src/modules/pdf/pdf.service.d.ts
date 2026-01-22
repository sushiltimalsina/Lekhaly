import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class PdfService {
    private prisma;
    constructor(prisma: PrismaService);
    createJob(user: AuthUser, type: string, payload: Record<string, unknown>): Promise<{
        error: string | null;
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.PdfJobStatus;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        resultKey: string | null;
    }>;
    getJob(user: AuthUser, id: string): Promise<{
        error: string | null;
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.PdfJobStatus;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        resultKey: string | null;
    }>;
    getJobDownloadUrl(user: AuthUser, id: string): Promise<{
        jobId: string;
        url: string;
        expiresAt: Date;
    }>;
}
