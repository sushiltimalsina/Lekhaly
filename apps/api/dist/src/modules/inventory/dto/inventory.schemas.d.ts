import { z } from "zod";
export declare const StockAdjustmentSchema: z.ZodObject<{
    itemId: z.ZodString;
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    qty: z.ZodNumber;
    rate: z.ZodOptional<z.ZodNumber>;
    accountId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodString>;
    binId: z.ZodOptional<z.ZodString>;
    memo: z.ZodOptional<z.ZodString>;
    batchNo: z.ZodOptional<z.ZodString>;
    lotNo: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    expiryDateBs: z.ZodOptional<z.ZodString>;
    serialNumbers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowNegativeOverride: z.ZodOptional<z.ZodBoolean>;
    overrideReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const StockQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const GoodsReceiptSchema: z.ZodObject<{
    receiptNo: z.ZodOptional<z.ZodString>;
    purchaseOrderId: z.ZodOptional<z.ZodString>;
    supplierId: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    memo: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        qty: z.ZodNumber;
        rate: z.ZodOptional<z.ZodNumber>;
        warehouseId: z.ZodOptional<z.ZodString>;
        binId: z.ZodOptional<z.ZodString>;
        batchNo: z.ZodOptional<z.ZodString>;
        lotNo: z.ZodOptional<z.ZodString>;
        expiryDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        expiryDateBs: z.ZodOptional<z.ZodString>;
        serialNumbers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const GoodsReceiptQuerySchema: z.ZodObject<{
    purchaseOrderId: z.ZodOptional<z.ZodString>;
    supplierId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        posted: "posted";
        reversed: "reversed";
    }>>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const StockDispatchQuerySchema: z.ZodObject<{
    salesOrderId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        posted: "posted";
        reversed: "reversed";
    }>>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const StockDispatchSchema: z.ZodObject<{
    dispatchNo: z.ZodOptional<z.ZodString>;
    salesOrderId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    memo: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        qty: z.ZodNumber;
        rate: z.ZodOptional<z.ZodNumber>;
        warehouseId: z.ZodOptional<z.ZodString>;
        binId: z.ZodOptional<z.ZodString>;
        batchNo: z.ZodOptional<z.ZodString>;
        lotNo: z.ZodOptional<z.ZodString>;
        expiryDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        expiryDateBs: z.ZodOptional<z.ZodString>;
        serialNumbers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const SalesOrderReservationSchema: z.ZodObject<{
    salesOrderId: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const ReservationQuerySchema: z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    salesOrderId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        fulfilled: "fulfilled";
        cancelled: "cancelled";
        partial: "partial";
        released: "released";
    }>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const MovementApprovalRequestSchema: z.ZodObject<{
    movementType: z.ZodEnum<{
        adjustment: "adjustment";
        transfer: "transfer";
    }>;
    payload: z.ZodRecord<z.ZodString, z.ZodAny>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const MovementApprovalQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        reversed: "reversed";
        approved: "approved";
        rejected: "rejected";
    }>>;
    movementType: z.ZodOptional<z.ZodEnum<{
        adjustment: "adjustment";
        transfer: "transfer";
    }>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const MovementApprovalActionSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const InventoryPeriodCloseSchema: z.ZodObject<{
    periodFrom: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    periodFromBs: z.ZodOptional<z.ZodString>;
    periodTo: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    periodToBs: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const InventoryPeriodCloseQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        closed: "closed";
        reopened: "reopened";
    }>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const BatchLotMasterQuerySchema: z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodString>;
    binId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    includeZero: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const StockAgingQuerySchema: z.ZodObject<{
    asOf: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    asOfBs: z.ZodOptional<z.ZodString>;
    includeZero: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    valuationMethod: z.ZodOptional<z.ZodEnum<{
        fifo: "fifo";
        weighted_average: "weighted_average";
    }>>;
}, z.core.$strip>;
export declare const StockValuationQuerySchema: z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodString>;
    binId: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    includeZero: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export declare const TrackedStockQuerySchema: z.ZodObject<{
    itemId: z.ZodString;
    warehouseId: z.ZodOptional<z.ZodString>;
    binId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const StockTransferSchema: z.ZodObject<{
    itemId: z.ZodString;
    fromWarehouseId: z.ZodString;
    fromBinId: z.ZodOptional<z.ZodString>;
    toWarehouseId: z.ZodString;
    toBinId: z.ZodOptional<z.ZodString>;
    qty: z.ZodNumber;
    rate: z.ZodOptional<z.ZodNumber>;
    batchNo: z.ZodOptional<z.ZodString>;
    lotNo: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    expiryDateBs: z.ZodOptional<z.ZodString>;
    serialNumbers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    memo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const InventoryAlertsQuerySchema: z.ZodObject<{
    expiringWithinDays: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    noMovementDays: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const InventorySettingsSchema: z.ZodObject<{
    inventoryTrackingEnabled: z.ZodOptional<z.ZodBoolean>;
    warehousesEnabled: z.ZodOptional<z.ZodBoolean>;
    binsEnabled: z.ZodOptional<z.ZodBoolean>;
    batchTrackingEnabled: z.ZodOptional<z.ZodBoolean>;
    lotTrackingEnabled: z.ZodOptional<z.ZodBoolean>;
    expiryTrackingEnabled: z.ZodOptional<z.ZodBoolean>;
    serialTrackingEnabled: z.ZodOptional<z.ZodBoolean>;
    kitsEnabled: z.ZodOptional<z.ZodBoolean>;
    goodsReceiptWorkflowEnabled: z.ZodOptional<z.ZodBoolean>;
    dispatchWorkflowEnabled: z.ZodOptional<z.ZodBoolean>;
    allowNegativeStock: z.ZodOptional<z.ZodBoolean>;
    requireWarehouseOnMovements: z.ZodOptional<z.ZodBoolean>;
    defaultWarehouseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    costingMethod: z.ZodOptional<z.ZodEnum<{
        fifo: "fifo";
        moving_average: "moving_average";
    }>>;
}, z.core.$strip>;
export declare const SerialQuerySchema: z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        available: "available";
        sold: "sold";
        returned: "returned";
        reserved: "reserved";
        damaged: "damaged";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const SerialMovementQuerySchema: z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    serialNo: z.ZodOptional<z.ZodString>;
    voucherId: z.ZodOptional<z.ZodString>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
