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
  defaultWarehouseId?: string | null;
  defaultBinId?: string | null;
  defaultBatchNo?: string | null;
  defaultLotNo?: string | null;
  defaultExpiryDate?: string | null;
  defaultExpiryDateBs?: string | null;
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

export type TrackedStockOption = {
  warehouseId?: string | null;
  warehouseName?: string | null;
  binId?: string | null;
  binName?: string | null;
  batchNo?: string | null;
  lotNo?: string | null;
  expiryDate?: string | null;
  expiryDateBs?: string | null;
  qty: number;
  value: number;
  rate: number;
  receivedDate?: string | null;
};

export type TrackedStockOptions = {
  item: { id: string; name: string; sku?: string | null; isSerialized?: boolean; tracksBatch?: boolean; tracksLot?: boolean; tracksExpiry?: boolean };
  options: TrackedStockOption[];
  serials: Array<{ id: string; serialNo: string; warehouseId?: string | null; binId?: string | null }>;
};

export async function getStockValuationReport(query?: { itemId?: string; warehouseId?: string; binId?: string; groupId?: string; q?: string; includeZero?: boolean }) {
  return apiRequest<StockValuationReport>({
    path: "/inventory/valuation",
    query,
  });
}

export async function getTrackedStockOptions(query: { itemId: string; warehouseId?: string; binId?: string }) {
  return apiRequest<TrackedStockOptions>({
    path: "/inventory/tracked-stock",
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
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceType?: string | null;
  partyId?: string | null;
  partyName?: string | null;
  sourceDocumentType?: string | null;
  sourceDocumentId?: string | null;
};

export async function getItemStockLedger(itemId: string, query?: { from?: string; to?: string }) {
  return apiRequest<{
    itemId: string;
    item?: { id: string; name: string; sku?: string | null; unit?: string | null; group?: string | null; isSerialized?: boolean; tracksBatch?: boolean; tracksLot?: boolean; tracksExpiry?: boolean };
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

export type StockReservationRecord = {
  id: string;
  salesOrderId?: string | null;
  salesOrderItemId?: string | null;
  itemId: string;
  warehouseId?: string | null;
  binId?: string | null;
  batchNo?: string | null;
  lotNo?: string | null;
  expiryDate?: string | null;
  expiryDateBs?: string | null;
  qty: number;
  reservedQty: number;
  releasedQty: number;
  fulfilledQty: number;
  status: string;
  expiresAt?: string | null;
};

export type InventoryMovementLineInput = {
  itemId: string;
  qty: number;
  rate?: number;
  warehouseId?: string;
  binId?: string;
  batchNo?: string;
  lotNo?: string;
  expiryDate?: string;
  expiryDateBs?: string;
  serialNumbers?: string[];
};

export type GoodsReceiptInput = {
  receiptNo?: string;
  purchaseOrderId?: string;
  supplierId?: string;
  date?: string;
  dateBs?: string;
  memo?: string;
  lines: InventoryMovementLineInput[];
};

export type GoodsReceiptRecord = {
  id: string;
  receiptNo?: string | null;
  purchaseOrderId?: string | null;
  purchaseOrderNo?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  date: string;
  dateBs?: string | null;
  status: string;
  memo?: string | null;
  lineCount: number;
  totalQty: number;
  totalAmount: number;
  lines: Array<{
    id: string;
    itemId: string;
    qty: number;
    rate: number;
    amount: number;
    batchNo?: string | null;
    lotNo?: string | null;
    expiryDate?: string | null;
    item?: { id: string; name: string; sku?: string | null; unit?: string | null } | null;
  }>;
};

export type StockDispatchInput = {
  dispatchNo?: string;
  salesOrderId?: string;
  customerId?: string;
  date?: string;
  dateBs?: string;
  memo?: string;
  lines: InventoryMovementLineInput[];
};

export type InventoryMovementApproval = {
  id: string;
  movementType: "adjustment" | "transfer";
  status: "pending" | "approved" | "rejected" | "reversed";
  payloadJson: unknown;
  reason?: string | null;
  postedVoucherId?: string | null;
  reversalVoucherId?: string | null;
};

export type InventoryPeriodClose = {
  id: string;
  periodFrom: string;
  periodFromBs?: string | null;
  periodTo: string;
  periodToBs?: string | null;
  status: string;
  costingMethod?: string | null;
  totalQty: number;
  totalValue: number;
  snapshotJson: unknown;
};

export async function reserveSalesOrderStock(input: { salesOrderId: string; expiresAt?: string }) {
  return apiRequest<{ ok: boolean; salesOrderId: string; reservations: StockReservationRecord[] }>({
    path: "/inventory/reservations/sales-order",
    method: "POST",
    body: input,
  });
}

export async function listStockReservations(query?: { itemId?: string; salesOrderId?: string; status?: string; take?: number }) {
  return apiRequest<StockReservationRecord[]>({ path: "/inventory/reservations", query });
}

export async function releaseStockReservation(id: string) {
  return apiRequest<StockReservationRecord>({ path: `/inventory/reservations/${id}/release`, method: "POST" });
}

export async function postGoodsReceipt(input: GoodsReceiptInput) {
  return apiRequest<{ ok: boolean; receiptId: string; lines: unknown[] }>({
    path: "/inventory/goods-receipts",
    method: "POST",
    body: input,
  });
}

export async function listGoodsReceipts(query?: {
  purchaseOrderId?: string;
  supplierId?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  take?: number;
  skip?: number;
}) {
  return apiRequest<{ data: GoodsReceiptRecord[]; meta: { total: number; page: number; lastPage: number } }>({
    path: "/inventory/goods-receipts",
    query,
  });
}

export async function postStockDispatch(input: StockDispatchInput) {
  return apiRequest<{ ok: boolean; dispatchId: string; lines: unknown[] }>({
    path: "/inventory/dispatches",
    method: "POST",
    body: input,
  });
}

export async function listBatchLotMaster(query?: { itemId?: string; warehouseId?: string; binId?: string; q?: string; includeZero?: boolean; take?: number }) {
  return apiRequest<unknown[]>({ path: "/inventory/batch-lots", query });
}

export async function getReorderSuggestions() {
  return apiRequest<Array<StockReportRow & { availableQty: number; reorderLevel: number; suggestedQty: number }>>({
    path: "/inventory/reorder-suggestions",
  });
}

export async function listInventoryMovementApprovals(query?: { status?: string; movementType?: string; take?: number }) {
  return apiRequest<InventoryMovementApproval[]>({ path: "/inventory/movement-approvals", query });
}

export async function createInventoryMovementApproval(input: { movementType: "adjustment" | "transfer"; payload: Record<string, unknown>; reason?: string }) {
  return apiRequest<InventoryMovementApproval>({
    path: "/inventory/movement-approvals",
    method: "POST",
    body: input,
  });
}

export async function approveInventoryMovement(id: string, input?: { reason?: string }) {
  return apiRequest<InventoryMovementApproval>({ path: `/inventory/movement-approvals/${id}/approve`, method: "POST", body: input ?? {} });
}

export async function rejectInventoryMovement(id: string, input?: { reason?: string }) {
  return apiRequest<InventoryMovementApproval>({ path: `/inventory/movement-approvals/${id}/reject`, method: "POST", body: input ?? {} });
}

export async function reverseInventoryMovement(id: string, input?: { reason?: string }) {
  return apiRequest<InventoryMovementApproval>({ path: `/inventory/movement-approvals/${id}/reverse`, method: "POST", body: input ?? {} });
}

export async function listInventoryPeriodCloses(query?: { status?: string; take?: number }) {
  return apiRequest<InventoryPeriodClose[]>({ path: "/inventory/period-closes", query });
}

export async function closeInventoryPeriod(input: { periodFrom?: string; periodFromBs?: string; periodTo?: string; periodToBs?: string }) {
  return apiRequest<InventoryPeriodClose>({
    path: "/inventory/period-closes",
    method: "POST",
    body: input,
  });
}

export type StockAdjustmentInput = {
  itemId: string;
  date?: string;
  dateBs?: string;
  qty: number;
  rate?: number;
  accountId?: string;
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
