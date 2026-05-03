import type { AuthUser } from "../../common/auth/auth.types";
import { UnitsService } from "./units.service";
export declare class UnitsController {
    private units;
    constructor(units: UnitsService);
    create(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    reorder(user: AuthUser, body: any): Promise<{
        success: boolean;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
}
