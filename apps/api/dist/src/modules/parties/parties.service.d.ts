import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class PartiesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(user: AuthUser, input: Prisma.PartyCreateInput): Promise<{
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
    update(user: AuthUser, id: string, input: Prisma.PartyUpdateInput): Promise<{
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
    list(user: AuthUser, filters: {
        type?: string;
        isActive?: boolean;
        q?: string;
        skip?: number;
        take?: number;
    }): Promise<{
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
