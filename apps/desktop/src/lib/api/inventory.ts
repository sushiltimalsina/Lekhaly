// apps/web/src/lib/api/inventory.ts

import { apiRequest } from "./client";

export type StockReportRow = {
  id: string;
  name: string;
  sku?: string | null;
  hsCode?: string | null;
  unit?: string | null;
  type: "goods" | "services";
  trackInventory?: boolean;
  isSerialized?: boolean;
  isKit?: boolean;
  tracksBatch?: boolean;
  tracksLot?: boolean;
  tracksExpiry?: boolean;
  parentGroup: string;
  reorderLevel?: number;
  safetyStock?: number;
  onHandQty?: number;
  reservedQty?: number;
  availableQty?: number;
  isLowStock?: boolean;
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
};

export async function getStockReport(query?: { from?: string; to?: string }) {
  return apiRequest<StockReportRow[]>({
    path: "/inventory/report",
    query,
  });
}

export type StockAgingBucketKey = "0-30" | "31-60" | "61-90" | "91-180" | "181-365" | "365+";

export type StockAgingLayer = {
  date: string;
  dateBs?: string | null;
  ageDays: number;
  qty: number;
  value: number;
  rate: number;
  warehouseName?: string | null;
  binName?: string | null;
  batchNo?: string | null;
  lotNo?: string | null;
  expiryDate?: string | null;
  expiryDateBs?: string | null;
};

export type StockAgingRow = {
  itemId: string;
  name: string;
  sku?: string | null;
  unit?: string | null;
  group?: string | null;
  isSerialized?: boolean;
  isKit?: boolean;
  tracksBatch?: boolean;
  tracksLot?: boolean;
  tracksExpiry?: boolean;
  valuationMethod?: "fifo" | "weighted_average";
  totalQty: number;
  totalValue: number;
  avgAgeDays: number;
  oldestAgeDays: number;
  buckets: Record<StockAgingBucketKey, { qty: number; value: number }>;
  layers: StockAgingLayer[];
};

export type StockAgingReport = {
  meta: { asOf: string; asOfBs?: string | null; valuationMethod?: "fifo" | "weighted_average"; buckets: StockAgingBucketKey[] };
  rows: StockAgingRow[];
};

export async function getStockAgingReport(query?: { asOf?: string; asOfBs?: string; includeZero?: boolean; valuationMethod?: "fifo" | "weighted_average" }) {
  return apiRequest<StockAgingReport>({
    path: "/inventory/stock-aging",
    query,
  });
}

export type StockValuationLayer = {
  receivedDate: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
  binId?: string | null;
  binName?: string | null;
  batchNo?: string | null;
  lotNo?: string | null;
  expiryDate?: string | null;
  expiryDateBs?: string | null;
  qty: number;
  unitCost: number;
  value: number;
};

export type StockValuationRow = {
  itemId: string;
  name: string;
  sku?: string | null;
  unit?: string | null;
  group?: string | null;
  isSerialized?: boolean;
  isKit?: boolean;
  tracksBatch?: boolean;
  tracksLot?: boolean;
  tracksExpiry?: boolean;
  totalQty: number;
  avgCost: number;
  totalValue: number;
  layers: StockValuationLayer[];
};

export type StockValuationReport = {
  meta: { valuationSource: "layers" | "ledger" | "disabled"; costingMethod?: "moving_average" | "fifo"; generatedAt?: string };
  rows: StockValuationRow[];
};

export async function getStockValuationReport(query?: { itemId?: string; warehouseId?: string; groupId?: string; q?: string; includeZero?: boolean }) {
  return apiRequest<StockValuationReport>({
    path: "/inventory/valuation",
    query,
  });
}

export type StockLedgerEntry = {
  id: string;
  date: string;
  dateBs?: string | null;
  qtyIn: number;
  qtyOut: number;
  rate: number;
  amount: number;
  debitAmt?: number;
  creditAmt?: number;
  runningQty?: number;
  runningAmt?: number;
  batchNo?: string | null;
  lotNo?: string | null;
  expiryDate?: string | null;
  expiryDateBs?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  binId?: string | null;
  binName?: string | null;
  voucherId?: string | null;
  voucherNumber?: string | null;
  voucherType?: string | null;
  voucherDate?: string | null;
};

export async function getItemStockLedger(itemId: string, query?: { from?: string; to?: string }) {
  return apiRequest<{
    itemId: string;
    item?: { id: string; name: string; sku?: string | null; unit?: string | null; group?: string | null };
    qty: number;
    openingQty?: number;
    openingAmt?: number;
    debitQty?: number;
    debitAmt?: number;
    creditQty?: number;
    creditAmt?: number;
    closingQty?: number;
    closingAmt?: number;
    entries: StockLedgerEntry[];
  }>({
    path: `/items/${itemId}/stock`,
    query,
  });
}

export type InventoryAlerts = {
  meta: { expiringWithinDays: number; noMovementDays: number };
  counts: { belowReorder: number; zeroStock: number; expiringSoon: number; noMovement: number };
  belowReorder: Array<{ itemId: string; name: string; sku?: string | null; availableQty: number; reorderLevel: number; safetyStock: number }>;
  zeroStock: Array<{ itemId: string; name: string; sku?: string | null }>;
  expiringSoon: Array<{ itemId: string; batchNo?: string | null; lotNo?: string | null; expiryDate?: string | null; qty: number }>;
  noMovement: Array<{ itemId: string; name: string; sku?: string | null }>;
};

export async function getInventoryAlerts(query?: { expiringWithinDays?: number; noMovementDays?: number; limit?: number }) {
  return apiRequest<InventoryAlerts>({
    path: "/inventory/alerts",
    query,
  });
}

export type StockAdjustmentInput = {
  itemId: string;
  date?: string;
  dateBs?: string;
  qty: number;
  rate?: number;
  accountId: string;
  warehouseId?: string;
  binId?: string;
  memo?: string;
  batchNo?: string;
  lotNo?: string;
  expiryDate?: string;
  expiryDateBs?: string;
  serialNumbers?: string[];
  allowNegativeOverride?: boolean;
  overrideReason?: string;
};

export type StockTransferInput = {
  itemId: string;
  fromWarehouseId: string;
  fromBinId?: string;
  toWarehouseId: string;
  toBinId?: string;
  qty: number;
  rate?: number;
  batchNo?: string;
  lotNo?: string;
  expiryDate?: string;
  expiryDateBs?: string;
  serialNumbers?: string[];
  date?: string;
  dateBs?: string;
  memo?: string;
};

export type InventorySettings = {
  id?: string;
  companyId?: string;
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
  defaultWarehouseId?: string | null;
  costingMethod: "moving_average" | "fifo";
};

export type InventorySettingsInput = Partial<InventorySettings>;

export type SerialNumberRecord = {
  id: string;
  itemId: string;
  serialNo: string;
  status: string;
  warehouseId?: string | null;
  binId?: string | null;
  item?: { id: string; name: string; sku?: string | null };
  warehouse?: { id: string; name: string } | null;
  bin?: { id: string; name: string } | null;
};

export async function adjustInventoryStock(input: StockAdjustmentInput) {
  return apiRequest<{ ok: boolean; voucherId: string }>({
    path: "/inventory/adjustment",
    method: "POST",
    body: input,
  });
}

export async function transferInventoryStock(input: StockTransferInput) {
  return apiRequest<{ ok: boolean; voucherId: string }>({
    path: "/inventory/transfer",
    method: "POST",
    body: input,
  });
}

export async function getInventorySettings() {
  return apiRequest<InventorySettings>({ path: "/inventory/settings" });
}

export async function updateInventorySettings(input: InventorySettingsInput) {
  return apiRequest<InventorySettings>({
    path: "/inventory/settings",
    method: "POST",
    body: input,
  });
}

export async function listSerialNumbers(query?: { itemId?: string; status?: string; q?: string; take?: number }) {
  return apiRequest<SerialNumberRecord[]>({ path: "/inventory/serials", query });
}
