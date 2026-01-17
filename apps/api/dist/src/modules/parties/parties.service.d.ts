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
        type: import("@prisma/client").$Enums.PartyType;
        isActive: boolean;
        phone: string | null;
        address: string | null;
        panNumber: string | null;
        vatNumber: string | null;
    }>;
    update(user: AuthUser, id: string, input: Prisma.PartyUpdateInput): Promise<{
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
