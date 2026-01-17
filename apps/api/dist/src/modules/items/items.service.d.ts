import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class ItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    private validateRefs;
    create(user: AuthUser, input: Prisma.ItemCreateInput): Promise<{
        id: string;
        name: string;
        sku: string | null;
        unit: string | null;
        salesPrice: Prisma.Decimal | null;
        purchasePrice: Prisma.Decimal | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        incomeAccountId: string | null;
        expenseAccountId: string | null;
        taxCodeId: string | null;
    }>;
    update(user: AuthUser, id: string, input: Prisma.ItemUpdateInput): Promise<{
        id: string;
        name: string;
        sku: string | null;
        unit: string | null;
        salesPrice: Prisma.Decimal | null;
        purchasePrice: Prisma.Decimal | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        incomeAccountId: string | null;
        expenseAccountId: string | null;
        taxCodeId: string | null;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        sku: string | null;
        unit: string | null;
        salesPrice: Prisma.Decimal | null;
        purchasePrice: Prisma.Decimal | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        incomeAccountId: string | null;
        expenseAccountId: string | null;
        taxCodeId: string | null;
    }>;
    list(user: AuthUser, filters: {
        isActive?: boolean;
        q?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        name: string;
        sku: string | null;
        unit: string | null;
        salesPrice: Prisma.Decimal | null;
        purchasePrice: Prisma.Decimal | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        incomeAccountId: string | null;
        expenseAccountId: string | null;
        taxCodeId: string | null;
    }[]>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        sku: string | null;
        unit: string | null;
        salesPrice: Prisma.Decimal | null;
        purchasePrice: Prisma.Decimal | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        incomeAccountId: string | null;
        expenseAccountId: string | null;
        taxCodeId: string | null;
    }>;
}
