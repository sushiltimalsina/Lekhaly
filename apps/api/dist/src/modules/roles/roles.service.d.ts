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
        userRoles: ({
            user: {
                id: string;
                email: string;
                name: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
            };
        } & {
            userId: string;
            roleId: string;
        })[];
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
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    })[]>;
    updateSortOrder(user: AuthUser, data: {
        id: string;
        sortOrder: number;
    }[]): Promise<{
        success: boolean;
    }>;
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
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    getById(user: AuthUser, roleId: string): Promise<{
        userRoles: ({
            user: {
                id: string;
                email: string;
                name: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
            };
        } & {
            userId: string;
            roleId: string;
        })[];
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
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
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
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
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
