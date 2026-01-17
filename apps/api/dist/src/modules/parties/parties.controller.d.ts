import type { AuthUser } from "../../common/auth/auth.types";
import { PartiesService } from "./parties.service";
export declare class PartiesController {
    private parties;
    constructor(parties: PartiesService);
    create(user: AuthUser, body: any): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.PartyType;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.PartyType;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.PartyType;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.PartyType;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.PartyType;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
}
