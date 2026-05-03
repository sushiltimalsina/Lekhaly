import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class RolesService {
    private prisma;
    constructor(prisma: PrismaService);
    list(user: AuthUser, filters: {
        q?: string;
        skip?: number;
        take?: number;
    }): Promise<({
        rolePermissions: ({
            permission: {
                code: string;
                description: string;
            };
        } & {
            roleId: string;
            permissionCode: string;
        })[];
        userRoles: ({
            user: {
                id: string;
                name: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
                email: string;
            };
        } & {
            roleId: string;
            userId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    })[]>;
    listPermissions(): Promise<{
        code: string;
        description: string;
    }[]>;
    private ensurePermissionsExist;
    create(user: AuthUser, input: {
        name: string;
        permissionCodes: string[];
    }): Promise<{
        rolePermissions: ({
            permission: {
                code: string;
                description: string;
            };
        } & {
            roleId: string;
            permissionCode: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    getById(user: AuthUser, roleId: string): Promise<{
        rolePermissions: ({
            permission: {
                code: string;
                description: string;
            };
        } & {
            roleId: string;
            permissionCode: string;
        })[];
        userRoles: ({
            user: {
                id: string;
                name: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
                email: string;
            };
        } & {
            roleId: string;
            userId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    update(user: AuthUser, roleId: string, input: {
        name?: string;
        permissionCodes?: string[];
    }): Promise<{
        rolePermissions: ({
            permission: {
                code: string;
                description: string;
            };
        } & {
            roleId: string;
            permissionCode: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    remove(user: AuthUser, roleId: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    assignUser(user: AuthUser, roleId: string, targetUserId: string): Promise<{
        roleId: string;
        userId: string;
        assigned: boolean;
    }>;
    removeUser(user: AuthUser, roleId: string, targetUserId: string): Promise<{
        roleId: string;
        userId: string;
        removed: boolean;
    }>;
}
