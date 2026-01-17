import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class AccountsService {
    private prisma;
    constructor(prisma: PrismaService);
    private validateParent;
    create(user: AuthUser, input: Prisma.ChartOfAccountCreateInput): Promise<{
        id: string;
        code: string;
        name: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        parentId: string | null;
    }>;
    update(user: AuthUser, id: string, input: Prisma.ChartOfAccountUpdateInput): Promise<{
        id: string;
        code: string;
        name: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        parentId: string | null;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        code: string;
        name: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        parentId: string | null;
    }>;
    list(user: AuthUser, filters: {
        type?: string;
        isActive?: boolean;
        q?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        code: string;
        name: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        parentId: string | null;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        code: string;
        name: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        parentId: string | null;
    }>;
    restore(user: AuthUser, id: string): Promise<{
        id: string;
        code: string;
        name: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        parentId: string | null;
    }>;
}
