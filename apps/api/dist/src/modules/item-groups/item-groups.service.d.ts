import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class ItemGroupsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(user: AuthUser, input: {
        name: string;
    }): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    list(user: AuthUser, filters: {
        q?: string;
        skip?: number;
        take?: number;
    }): Promise<{
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
