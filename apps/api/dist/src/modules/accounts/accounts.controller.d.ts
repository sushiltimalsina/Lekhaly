import type { AuthUser } from "../../common/auth/auth.types";
import { AccountsService } from "./accounts.service";
export declare class AccountsController {
    private accounts;
    constructor(accounts: AccountsService);
    create(user: AuthUser, body: any): Promise<{
        type: import("@prisma/client").$Enums.CoaType;
        code: string;
        name: string;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        type: import("@prisma/client").$Enums.CoaType;
        code: string;
        name: string;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    get(user: AuthUser, id: string): Promise<{
        type: import("@prisma/client").$Enums.CoaType;
        code: string;
        name: string;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    list(user: AuthUser, query: any): Promise<{
        type: import("@prisma/client").$Enums.CoaType;
        code: string;
        name: string;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        type: import("@prisma/client").$Enums.CoaType;
        code: string;
        name: string;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    restore(user: AuthUser, id: string): Promise<{
        type: import("@prisma/client").$Enums.CoaType;
        code: string;
        name: string;
        parentId: string | null;
        isPostable: boolean;
        isActive: boolean;
        companyId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
