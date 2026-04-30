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
            date: Date;
            dateBs: string | null;
            qtyIn: number;
            qtyOut: number;
            rate: number;
            amount: number;
            batchNo: string | null;
            lotNo: string | null;
            expiryDate: Date | null;
            expiryDateBs: string | null;
            voucherId: string | null;
            voucherNumber: string | null;
            voucherType: import("@prisma/client").$Enums.VoucherType | null;
            voucherDate: Date | null;
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
        batchNo?: string;
        lotNo?: string;
        expiryDate?: Date;
        expiryDateBs?: string;
        allowNegativeOverride?: boolean;
        overrideReason?: string;
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
        reorderLevel: number;
        safetyStock: number;
        onHandQty: number;
        reservedQty: number;
        availableQty: number;
        isLowStock: boolean;
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
    transferStock(user: AuthUser, input: {
        itemId: string;
        fromWarehouseId: string;
        fromBinId?: string;
        toWarehouseId: string;
        toBinId?: string;
        qty: number;
        rate?: number;
        batchNo?: string;
        lotNo?: string;
        expiryDate?: Date;
        expiryDateBs?: string;
        date?: Date;
        dateBs?: string;
        memo?: string;
    }): Promise<{
        ok: boolean;
        voucherId: string;
    }>;
    getInventoryAlerts(user: AuthUser, query: {
        expiringWithinDays?: number;
        noMovementDays?: number;
        limit?: number;
    }): Promise<{
        meta: {
            expiringWithinDays: number;
            noMovementDays: number;
        };
        counts: {
            belowReorder: number;
            zeroStock: number;
            expiringSoon: number;
            noMovement: number;
        };
        belowReorder: {
            itemId: any;
            name: any;
            sku: any;
            availableQty: any;
            reorderLevel: any;
            safetyStock: any;
        }[];
        zeroStock: {
            itemId: any;
            name: any;
            sku: any;
        }[];
        expiringSoon: {
            qty: number;
            itemId: string;
            batchNo: string | null;
            lotNo: string | null;
            expiryDate: Date | null;
            _sum: {
                qtyIn: Prisma.Decimal | null;
                qtyOut: Prisma.Decimal | null;
            };
        }[];
        noMovement: {
            itemId: any;
            name: any;
            sku: any;
        }[];
    }>;
}
