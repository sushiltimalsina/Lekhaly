import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class PartiesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(user: AuthUser, input: Prisma.PartyCreateInput): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
    }>;
    update(user: AuthUser, id: string, input: Prisma.PartyUpdateInput): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
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
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
    }>;
    restore(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        panNumber: string | null;
        vatNumber: string | null;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
    }>;
}
