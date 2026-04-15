import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class DevicesService {
    private prisma;
    constructor(prisma: PrismaService);
    list(user: AuthUser, filters: {
        trusted?: boolean;
        q?: string;
        skip?: number;
        take?: number;
    }): Promise<({
        deviceUsers: ({
            user: {
                id: string;
                email: string;
                name: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            deviceId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        label: string;
        platform: string;
        trusted: boolean;
        proformaPrefix: string | null;
        proformaSequence: number;
        lastSeenAt: Date | null;
    })[]>;
    setTrust(user: AuthUser, deviceId: string, trusted: boolean): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        label: string;
        platform: string;
        trusted: boolean;
        proformaPrefix: string | null;
        proformaSequence: number;
        lastSeenAt: Date | null;
    }>;
    unlinkUser(user: AuthUser, deviceId: string, targetUserId: string): Promise<{
        deviceId: string;
        userId: string;
        unlinked: boolean;
    }>;
}
