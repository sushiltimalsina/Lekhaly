import type { AuthUser } from "../../common/auth/auth.types";
import { RolesService } from "./roles.service";
export declare class RolesController {
    private roles;
    constructor(roles: RolesService);
    list(user: AuthUser, query: any): Promise<({
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
    reorder(user: AuthUser, body: any): Promise<{
        success: boolean;
    }>;
    permissions(): Promise<{
        code: string;
        description: string;
    }[]>;
    getById(user: AuthUser, id: string): Promise<{
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
    create(user: AuthUser, body: any): Promise<{
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
    update(user: AuthUser, id: string, body: any): Promise<{
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
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    assignUser(user: AuthUser, id: string, body: any): Promise<{
        roleId: string;
        userId: string;
        assigned: boolean;
    }>;
    removeUser(user: AuthUser, id: string, userId: string): Promise<{
        roleId: string;
        userId: string;
        removed: boolean;
    }>;
}
