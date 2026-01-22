import type { AuthUser } from "../../common/auth/auth.types";
import { UsersService } from "./users.service";
export declare class UsersController {
    private users;
    constructor(users: UsersService);
    list(user: AuthUser, query: any): Promise<{
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
    getById(user: AuthUser, id: string): Promise<{
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
    create(user: AuthUser, body: any): Promise<{
        id: string;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
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
