import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getStock(user: AuthUser, itemId: string, filters: {
        from?: Date;
        to?: Date;
    }): Promise<{
        itemId: string;
        qty: Prisma.Decimal;
        entries: {
            id: string;
            companyId: string;
            createdAt: Date;
            rate: Prisma.Decimal;
            voucherId: string | null;
            itemId: string;
            date: Date;
            dateBs: string | null;
            qtyIn: Prisma.Decimal;
            qtyOut: Prisma.Decimal;
            amount: Prisma.Decimal;
        }[];
    }>;
    adjustStock(user: AuthUser, input: {
        itemId: string;
        date?: Date;
        dateBs?: string;
        qty: number;
        rate?: number;
        accountId: string;
        memo?: string;
    }): Promise<{
        ok: boolean;
        voucherId: string;
    }>;
}
