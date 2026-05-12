import { z } from "zod";
export declare const StockAdjustmentSchema: z.ZodObject<{
    itemId: z.ZodString;
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    qty: z.ZodNumber;
    rate: z.ZodOptional<z.ZodNumber>;
    accountId: z.ZodString;
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
export declare const StockAgingQuerySchema: z.ZodObject<{
    asOf: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    asOfBs: z.ZodOptional<z.ZodString>;
    includeZero: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    valuationMethod: z.ZodOptional<z.ZodEnum<{
        fifo: "fifo";
        weighted_average: "weighted_average";
    }>>;
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
