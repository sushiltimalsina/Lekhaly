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
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
