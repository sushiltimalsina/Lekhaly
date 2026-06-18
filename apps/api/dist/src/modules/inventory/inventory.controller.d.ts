import type { AuthUser } from "../../common/auth/auth.types";
import { InventoryService } from "./inventory.service";
export declare class InventoryController {
    private inventory;
    constructor(inventory: InventoryService);
    settings(user: AuthUser): Promise<any>;
    updateSettings(user: AuthUser, body: any): Promise<{
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
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    serials(user: AuthUser, query: any): Promise<({
        item: {
            name: string;
            id: string;
            sku: string | null;
        };
        warehouse: {
            name: string;
            id: string;
        } | null;
        bin: {
            name: string;
            id: string;
        } | null;
    } & {
        itemId: string;
        warehouseId: string | null;
        binId: string | null;
        status: string;
        serialNo: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        purchaseInvoiceId: string | null;
        salesInvoiceId: string | null;
    })[]>;
    serialMovements(user: AuthUser, query: any): Promise<any>;
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
        isSerialized: boolean;
        isKit: boolean;
        tracksBatch: boolean;
        tracksLot: boolean;
        tracksExpiry: boolean;
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
    stockAging(user: AuthUser, query: any): Promise<{
        meta: {
            asOf: Date;
            asOfBs: string | null;
            valuationMethod: "fifo" | "weighted_average";
            buckets: string[];
        };
        rows: never[];
    } | {
        meta: {
            asOf: Date;
            asOfBs: string | null;
            valuationMethod: "fifo" | "weighted_average";
            buckets: ("0-30" | "31-60" | "61-90" | "91-180" | "181-365" | "365+")[];
        };
        rows: {
            itemId: string;
            name: string;
            sku: string | null;
            unit: string | null;
            group: string | null;
            isSerialized: boolean;
            isKit: boolean;
            tracksBatch: boolean;
            tracksLot: boolean;
            tracksExpiry: boolean;
            valuationMethod: "fifo" | "weighted_average";
            totalQty: number;
            totalValue: number;
            avgAgeDays: number;
            oldestAgeDays: number;
            buckets: {
                [k: string]: {
                    qty: number;
                    value: number;
                };
            };
            layers: {
                date: Date;
                dateBs: string | null;
                ageDays: number;
                qty: number;
                value: number;
                rate: number;
                warehouseName: string | null;
                binName: string | null;
                batchNo: string | null;
                lotNo: string | null;
                expiryDate: Date | null;
                expiryDateBs: string | null;
            }[];
        }[];
    }>;
    valuation(user: AuthUser, query: any): Promise<{
        meta: {
            valuationSource: string;
            costingMethod: any;
            generatedAt?: undefined;
        };
        rows: never[];
    } | {
        meta: {
            valuationSource: "layers" | "ledger";
            costingMethod: any;
            generatedAt: Date;
        };
        rows: {
            itemId: string;
            name: string;
            sku: string | null;
            unit: string | null;
            group: string | null;
            isSerialized: boolean;
            isKit: boolean;
            tracksBatch: boolean;
            tracksLot: boolean;
            tracksExpiry: boolean;
            totalQty: number;
            avgCost: number;
            totalValue: number;
            layers: {
                receivedDate: any;
                warehouseId: any;
                warehouseName: any;
                binId: any;
                binName: any;
                batchNo: any;
                lotNo: any;
                expiryDate: any;
                expiryDateBs: any;
                qty: number;
                unitCost: number;
                value: number;
            }[];
        }[];
    }>;
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
