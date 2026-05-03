import type { AuthUser } from "../../common/auth/auth.types";
import { RolesService } from "./roles.service";
export declare class RolesController {
    private roles;
    constructor(roles: RolesService);
    list(user: AuthUser, query: any): Promise<({
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
    permissions(): Promise<{
        code: string;
        description: string;
    }[]>;
    getById(user: AuthUser, id: string): Promise<{
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
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
