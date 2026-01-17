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
        isPostable: boolean;
        isActive: boolean;
        parentId: string | null;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        parentId: string | null;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        parentId: string | null;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        parentId: string | null;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        type: import("@prisma/client").$Enums.CoaType;
        isPostable: boolean;
        isActive: boolean;
        parentId: string | null;
    }>;
}
