import type { AuthUser } from "../../common/auth/auth.types";
import { AccountsService } from "./accounts.service";
export declare class AccountsController {
    private accounts;
    constructor(accounts: AccountsService);
    create(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
    }>;
    restore(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
    }>;
}
