import type { AuthUser } from "../../common/auth/auth.types";
import { ItemGroupsService } from "./item-groups.service";
export declare class ItemGroupsController {
    private groups;
    constructor(groups: ItemGroupsService);
    create(user: AuthUser, body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
}
