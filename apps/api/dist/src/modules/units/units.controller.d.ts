import type { AuthUser } from "../../common/auth/auth.types";
import { UnitsService } from "./units.service";
export declare class UnitsController {
    private units;
    constructor(units: UnitsService);
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
