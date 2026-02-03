import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class AccountsService {
    private prisma;
    constructor(prisma: PrismaService);
    private validateParent;
    create(user: AuthUser, input: Prisma.ChartOfAccountCreateInput): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isActive: boolean;
        parentId: string | null;
        isPostable: boolean;
    }>;
    update(user: AuthUser, id: string, input: Prisma.ChartOfAccountUpdateInput): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isActive: boolean;
        parentId: string | null;
        isPostable: boolean;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isActive: boolean;
        parentId: string | null;
        isPostable: boolean;
    }>;
    list(user: AuthUser, filters: {
        type?: string;
        isActive?: boolean;
        q?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isActive: boolean;
        parentId: string | null;
        isPostable: boolean;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isActive: boolean;
        parentId: string | null;
        isPostable: boolean;
    }>;
    restore(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isActive: boolean;
        parentId: string | null;
        isPostable: boolean;
    }>;
}
