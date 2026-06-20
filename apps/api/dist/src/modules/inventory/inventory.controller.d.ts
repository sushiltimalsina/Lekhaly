import type { AuthUser } from "../../common/auth/auth.types";
import { InventoryService } from "./inventory.service";
export declare class InventoryController {
    private inventory;
    constructor(inventory: InventoryService);
    settings(user: AuthUser): Promise<any>;
    updateSettings(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        inventoryTrackingEnabled: boolean;
        warehousesEnabled: boolean;
        binsEnabled: boolean;
        batchTrackingEnabled: boolean;
        lotTrackingEnabled: boolean;
        expiryTrackingEnabled: boolean;
        serialTrackingEnabled: boolean;
        kitsEnabled: boolean;
        goodsReceiptWorkflowEnabled: boolean;
        dispatchWorkflowEnabled: boolean;
        adjustmentApprovalRequired: boolean;
        transferApprovalRequired: boolean;
        negativeStockApprovalRequired: boolean;
        reversalApprovalRequired: boolean;
        allowNegativeStock: boolean;
        requireWarehouseOnMovements: boolean;
        defaultWarehouseId: string | null;
        costingMethod: string;
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
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        itemId: string;
        warehouseId: string | null;
        binId: string | null;
        status: string;
        serialNo: string;
        purchaseInvoiceId: string | null;
        salesInvoiceId: string | null;
    })[]>;
    serialMovements(user: AuthUser, query: any): Promise<any>;
    adjust(user: AuthUser, body: any): Promise<{
        ok: boolean;
        voucherId: string;
    } | {
        ok: boolean;
        approvalRequired: boolean;
        approvalId: any;
        status: any;
    }>;
    goodsReceipt(user: AuthUser, body: any): Promise<{
        ok: boolean;
        receiptId: any;
        lines: any[];
    }>;
    goodsReceipts(user: AuthUser, query: any): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            lastPage: number;
        };
    }>;
    dispatches(user: AuthUser, query: any): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            lastPage: number;
        };
    }>;
    dispatch(user: AuthUser, body: any): Promise<{
        ok: boolean;
        dispatchId: any;
        lines: any[];
    }>;
    reservations(user: AuthUser, query: any): Promise<any>;
    reserveSalesOrder(user: AuthUser, body: any): Promise<{
        ok: boolean;
        salesOrderId: string;
        reservations: any[];
    }>;
    releaseReservation(user: AuthUser, id: string): Promise<any>;
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
        defaultWarehouseId: any;
        defaultBinId: any;
        defaultBatchNo: any;
        defaultLotNo: any;
        defaultExpiryDate: any;
        defaultExpiryDateBs: any;
        parentGroup: string;
        reorderLevel: number;
        safetyStock: number;
        minStockLevel: number;
        reorderQty: number;
        onHandQty: number;
        reservedQty: number;
        availableQty: number;
        pendingPurchaseQty: number;
        effectiveAvailableQty: number;
        reorderThreshold: number;
        shortageQty: number;
        suggestedQty: number;
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
    batchLots(user: AuthUser, query: any): Promise<any>;
    reorderSuggestions(user: AuthUser): Promise<any[]>;
    trackedStock(user: AuthUser, query: any): Promise<{
        item: {
            name: string;
            id: string;
            sku: string | null;
            isSerialized: boolean;
            tracksBatch: boolean;
            tracksLot: boolean;
            tracksExpiry: boolean;
        };
        options: {
            warehouseId: any;
            warehouseName: string | null;
            binId: any;
            binName: string | null;
            batchNo: any;
            lotNo: any;
            expiryDate: any;
            expiryDateBs: any;
            qty: number;
            value: number;
            rate: number;
            receivedDate: any;
        }[];
        serials: never[] | {
            id: string;
            warehouseId: string | null;
            binId: string | null;
            serialNo: string;
        }[];
    }>;
    transfer(user: AuthUser, body: any): Promise<{
        ok: boolean;
        voucherId: string;
    } | {
        ok: boolean;
        approvalRequired: boolean;
        approvalId: any;
        status: any;
    }>;
    movementApprovals(user: AuthUser, query: any): Promise<any>;
    createMovementApproval(user: AuthUser, body: any): Promise<any>;
    approveMovement(user: AuthUser, id: string, body: any): Promise<any>;
    rejectMovement(user: AuthUser, id: string, body: any): Promise<any>;
    reverseMovement(user: AuthUser, id: string, body: any): Promise<any>;
    periodCloses(user: AuthUser, query: any): Promise<any>;
    closePeriod(user: AuthUser, body: any): Promise<any>;
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
