import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class PartiesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(user: AuthUser, input: Prisma.PartyCreateInput): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
    update(user: AuthUser, id: string, input: Prisma.PartyUpdateInput): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
    list(user: AuthUser, filters: {
        type?: string;
        isActive?: boolean;
        q?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
    restore(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
}
