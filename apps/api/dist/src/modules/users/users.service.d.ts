import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    list(user: AuthUser, filters: {
        q?: string;
        status?: "active" | "disabled";
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        email: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        userRoles: ({
            role: {
                id: string;
                companyId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            userId: string;
            roleId: string;
        })[];
    }[]>;
    getById(user: AuthUser, userId: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        userRoles: ({
            role: {
                id: string;
                companyId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            userId: string;
            roleId: string;
        })[];
    }>;
    private ensureRoles;
    create(user: AuthUser, input: {
        email: string;
        name?: string;
        password: string;
        roleIds?: string[];
    }): Promise<{
        id: string;
    }>;
    update(user: AuthUser, userId: string, input: {
        name?: string;
        status?: "active" | "disabled";
        roleIds?: string[];
    }): Promise<{
        id: string;
        companyId: string;
        email: string;
        name: string | null;
        passwordHash: string;
        status: import("@prisma/client").$Enums.UserStatus;
        totpEnabled: boolean;
        totpSecretEnc: string | null;
        trustedDeviceVersion: number;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
