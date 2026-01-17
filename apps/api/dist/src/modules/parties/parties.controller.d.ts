import type { AuthUser } from "../../common/auth/auth.types";
import { PartiesService } from "./parties.service";
export declare class PartiesController {
    private parties;
    constructor(parties: PartiesService);
    create(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
}
