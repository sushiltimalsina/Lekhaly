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
            voucherId: string | null;
            date: Date;
            dateBs: string | null;
            itemId: string;
            amount: Prisma.Decimal;
            rate: Prisma.Decimal;
            qtyIn: Prisma.Decimal;
            qtyOut: Prisma.Decimal;
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
    getStockReport(user: AuthUser, filters: {
        from?: Date;
        to?: Date;
    }): Promise<{
        id: string;
        name: string;
        sku: string | null;
        hsCode: any;
        unit: string | null;
        type: any;
        parentGroup: string;
        openingQty: number;
        openingAvgPrice: number;
        openingAmt: number;
        purchaseQty: number;
        purchaseAvgPrice: number;
        purchaseAmt: number;
        saleQty: number;
        saleAvgPrice: number;
        saleAmt: number;
        closingQty: number;
        closingPrice: number;
        closingAmt: number;
    }[]>;
}
