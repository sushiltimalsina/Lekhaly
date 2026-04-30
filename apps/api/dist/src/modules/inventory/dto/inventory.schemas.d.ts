import { z } from "zod";
export declare const StockAdjustmentSchema: z.ZodObject<{
    itemId: z.ZodString;
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    qty: z.ZodNumber;
    rate: z.ZodOptional<z.ZodNumber>;
    accountId: z.ZodString;
    memo: z.ZodOptional<z.ZodString>;
    batchNo: z.ZodOptional<z.ZodString>;
    lotNo: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    expiryDateBs: z.ZodOptional<z.ZodString>;
    allowNegativeOverride: z.ZodOptional<z.ZodBoolean>;
    overrideReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const StockQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
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
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    memo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const InventoryAlertsQuerySchema: z.ZodObject<{
    expiringWithinDays: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    noMovementDays: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
