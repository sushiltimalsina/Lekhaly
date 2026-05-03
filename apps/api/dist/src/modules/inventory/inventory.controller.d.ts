import type { AuthUser } from "../../common/auth/auth.types";
import { InventoryService } from "./inventory.service";
export declare class InventoryController {
    private inventory;
    constructor(inventory: InventoryService);
    settings(user: AuthUser): Promise<any>;
    updateSettings(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        inventoryTrackingEnabled: boolean;
        warehousesEnabled: boolean;
        binsEnabled: boolean;
        batchTrackingEnabled: boolean;
        lotTrackingEnabled: boolean;
        expiryTrackingEnabled: boolean;
        serialTrackingEnabled: boolean;
        kitsEnabled: boolean;
        allowNegativeStock: boolean;
        requireWarehouseOnMovements: boolean;
        defaultWarehouseId: string | null;
        costingMethod: string;
    }>;
    serials(user: AuthUser, query: any): Promise<({
        item: {
            id: string;
            name: string;
            sku: string | null;
        };
        warehouse: {
            id: string;
            name: string;
        } | null;
        bin: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        itemId: string;
        warehouseId: string | null;
        binId: string | null;
        serialNo: string;
        purchaseInvoiceId: string | null;
        salesInvoiceId: string | null;
    })[]>;
    adjust(user: AuthUser, body: any): Promise<{
        ok: boolean;
        voucherId: string;
    }>;
    report(user: AuthUser, query: any): Promise<{
        id: string;
        name: string;
        sku: string | null;
        hsCode: any;
        unit: string | null;
        type: any;
        trackInventory: boolean;
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
    transfer(user: AuthUser, body: any): Promise<{
        ok: boolean;
        voucherId: string;
    }>;
    alerts(user: AuthUser, query: any): Promise<{
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
                qtyIn: import("@prisma/client/runtime/client").Decimal | null;
                qtyOut: import("@prisma/client/runtime/client").Decimal | null;
            };
        }[];
        noMovement: {
            itemId: any;
            name: any;
            sku: any;
        }[];
    }>;
}
