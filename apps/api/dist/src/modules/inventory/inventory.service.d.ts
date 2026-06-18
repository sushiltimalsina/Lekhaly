import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getOrCreateSettings(companyId: string, tx?: Prisma.TransactionClient): Promise<any>;
    getSettings(user: AuthUser): Promise<any>;
    resolveInventoryAssetAccountId(companyId: string, item: any, tx?: Prisma.TransactionClient): Promise<any>;
    private createInventoryAssetAccount;
    private nextAvailableAccountCode;
    private resolveStockAdjustmentAccountId;
    private ensureDefaultWarehouse;
    private ensureDefaultBin;
    updateSettings(user: AuthUser, input: {
        inventoryTrackingEnabled?: boolean;
        warehousesEnabled?: boolean;
        binsEnabled?: boolean;
        batchTrackingEnabled?: boolean;
        lotTrackingEnabled?: boolean;
        expiryTrackingEnabled?: boolean;
        serialTrackingEnabled?: boolean;
        kitsEnabled?: boolean;
        allowNegativeStock?: boolean;
        requireWarehouseOnMovements?: boolean;
        defaultWarehouseId?: string | null;
        costingMethod?: "moving_average" | "fifo";
    }): Promise<{
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
    private assertSettingsCanChange;
    private normalizeSerialNumbers;
    private assertSerializedQuantity;
    private scopeWhere;
    private fallbackAverageCost;
    private isMissingInventoryTableError;
    receiveInventoryLayer(tx: Prisma.TransactionClient, input: {
        companyId: string;
        itemId: string;
        qty: Prisma.Decimal;
        unitCost: Prisma.Decimal;
        date: Date;
        sourceLedgerId?: string | null;
        sourceVoucherId?: string | null;
        sourceType?: string;
        warehouseId?: string | null;
        binId?: string | null;
        batchNo?: string | null;
        lotNo?: string | null;
        expiryDate?: Date | null;
        expiryDateBs?: string | null;
    }): Promise<any>;
    consumeInventoryCost(tx: Prisma.TransactionClient, input: {
        companyId: string;
        itemId: string;
        qty: Prisma.Decimal;
        costingMethod?: string | null;
        allowNegative?: boolean;
        warehouseId?: string | null;
        binId?: string | null;
        batchNo?: string | null;
        lotNo?: string | null;
        expiryDate?: Date | null;
    }): Promise<{
        unitCost: Prisma.Decimal;
        amount: Prisma.Decimal;
        consumedQty: Prisma.Decimal;
    }>;
    recordSerialMovements(tx: Prisma.TransactionClient, input: {
        companyId: string;
        itemId: string;
        serials: Array<{
            id: string;
            serialNo: string;
            status?: string | null;
            warehouseId?: string | null;
            binId?: string | null;
        }>;
        voucherId?: string | null;
        stockLedgerId?: string | null;
        movementType: string;
        statusTo?: string | null;
        toWarehouseId?: string | null;
        toBinId?: string | null;
        movementDate: Date;
        movementDateBs?: string | null;
    }): Promise<void>;
    private applyMovementPolicy;
    getStock(user: AuthUser, itemId: string, filters: {
        from?: Date;
        to?: Date;
    }): Promise<{
        itemId: string;
        item: {
            id: string;
            name: string;
            sku: string | null;
            unit: string | null;
            group: string | null;
            isSerialized: boolean;
            tracksBatch: boolean;
            tracksLot: boolean;
            tracksExpiry: boolean;
        };
        qty: number;
        openingQty: number;
        openingAmt: number;
        debitQty: number;
        debitAmt: number;
        creditQty: number;
        creditAmt: number;
        closingQty: number;
        closingAmt: number;
        entries: {
            id: string;
            date: Date;
            dateBs: string | null;
            qtyIn: number;
            qtyOut: number;
            rate: number;
            amount: number;
            debitAmt: number;
            creditAmt: number;
            runningQty: number;
            runningAmt: number;
            batchNo: string | null;
            lotNo: string | null;
            expiryDate: Date | null;
            expiryDateBs: string | null;
            warehouseId: string | null;
            warehouseName: string | null;
            binId: string | null;
            binName: string | null;
            voucherId: string | null;
            voucherNumber: string | null;
            voucherType: import("@prisma/client").$Enums.VoucherType | null;
            voucherDate: Date | null;
            invoiceId: string | null;
            invoiceNumber: string | null;
            invoiceType: string | null;
            partyId: string | null;
            partyName: string | null;
            sourceDocumentType: string | null;
            sourceDocumentId: string | null;
        }[];
    }>;
    adjustStock(user: AuthUser, input: {
        itemId: string;
        date?: Date;
        dateBs?: string;
        qty: number;
        rate?: number;
        accountId?: string;
        warehouseId?: string;
        binId?: string;
        memo?: string;
        batchNo?: string;
        lotNo?: string;
        expiryDate?: Date;
        expiryDateBs?: string;
        serialNumbers?: string[];
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
    getStockAgingReport(user: AuthUser, filters: {
        asOf?: Date;
        asOfBs?: string;
        includeZero?: boolean;
        valuationMethod?: "fifo" | "weighted_average";
    }): Promise<{
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
    getStockValuationReport(user: AuthUser, filters: {
        itemId?: string;
        warehouseId?: string;
        binId?: string;
        groupId?: string;
        q?: string;
        includeZero?: boolean;
    }): Promise<{
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
        serialNumbers?: string[];
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
    listSerialNumbers(user: AuthUser, query: {
        itemId?: string;
        status?: string;
        q?: string;
        take?: number;
    }): Promise<({
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
    listSerialMovements(user: AuthUser, query: {
        itemId?: string;
        serialNo?: string;
        voucherId?: string;
        take?: number;
    }): Promise<any>;
}
