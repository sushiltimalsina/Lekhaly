import { apiRequest } from "./client";

export type StockCountStatus = "draft" | "in_progress" | "completed" | "cancelled";

export type StockCountLine = {
  id: string;
  itemId: string;
  binId?: string | null;
  systemQty: number;
  countedQty?: number | null;
  variance?: number | null;
  batchNo?: string | null;
  lotNo?: string | null;
  note?: string | null;
  item?: any;
  bin?: any;
};

export type StockCount = {
  id: string;
  reference?: string | null;
  warehouseId?: string | null;
  countDate: string;
  countDateBs?: string | null;
  status: StockCountStatus;
  memo?: string | null;
  lines: StockCountLine[];
  warehouse?: any;
  createdByUser?: any;
  _count?: { lines: number };
  createdAt: string;
};

export async function listStockCounts(query?: any) {
  return apiRequest<StockCount[]>({ path: "/inventory/stock-counts", query });
}

export async function getStockCount(id: string) {
  return apiRequest<StockCount>({ path: `/inventory/stock-counts/${id}` });
}

export async function createStockCount(data: any) {
  return apiRequest<StockCount>({
    path: "/inventory/stock-counts",
    method: "POST",
    body: data,
  });
}

export async function updateStockCount(id: string, data: any) {
  return apiRequest<StockCount>({
    path: `/inventory/stock-counts/${id}`,
    method: "PATCH",
    body: data,
  });
}

export async function completeStockCount(id: string, adjustmentAccountId: string) {
  return apiRequest<StockCount>({
    path: `/inventory/stock-counts/${id}/complete`,
    method: "POST",
    body: { adjustmentAccountId },
  });
}

export async function deleteStockCount(id: string) {
  return apiRequest({
    path: `/inventory/stock-counts/${id}`,
    method: "DELETE",
  });
}
