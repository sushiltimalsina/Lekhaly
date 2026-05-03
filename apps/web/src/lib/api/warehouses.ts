// apps/web/src/lib/api/warehouses.ts

import { apiRequest } from "./client";

export type Warehouse = {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bins: WarehouseBin[];
  _count?: { bins: number; stockLedger: number };
  totalStockQty?: number;
  totalStockValue?: number;
};

export type WarehouseBin = {
  id: string;
  companyId: string;
  warehouseId: string;
  name: string;
  code?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listWarehouses(query?: { isActive?: boolean; q?: string }) {
  return apiRequest<Warehouse[]>({ path: "/warehouses", query });
}

export async function getWarehouse(id: string) {
  return apiRequest<Warehouse>({ path: `/warehouses/${id}` });
}

export async function createWarehouse(input: { name: string; code?: string }) {
  return apiRequest<Warehouse>({ path: "/warehouses", method: "POST", body: input });
}

export async function updateWarehouse(id: string, input: { name?: string; code?: string; isActive?: boolean }) {
  return apiRequest<Warehouse>({ path: `/warehouses/${id}`, method: "PATCH", body: input });
}

export async function deleteWarehouse(id: string) {
  return apiRequest<Warehouse>({ path: `/warehouses/${id}`, method: "DELETE" });
}

export async function listBins(warehouseId: string) {
  return apiRequest<WarehouseBin[]>({ path: `/warehouses/${warehouseId}/bins` });
}

export async function createBin(warehouseId: string, input: { name: string; code?: string }) {
  return apiRequest<WarehouseBin>({ path: `/warehouses/${warehouseId}/bins`, method: "POST", body: input });
}

export async function updateBin(binId: string, input: { name?: string; code?: string; isActive?: boolean }) {
  return apiRequest<WarehouseBin>({ path: `/warehouses/bins/${binId}`, method: "PATCH", body: input });
}

export async function deleteBin(binId: string) {
  return apiRequest<WarehouseBin>({ path: `/warehouses/bins/${binId}`, method: "DELETE" });
}

export async function reorderWarehouses(items: { id: string; sortOrder: number }[]) {
  return apiRequest<void>({ path: "/warehouses/reorder", method: "PATCH", body: items });
}

export async function reorderBins(items: { id: string; sortOrder: number }[]) {
  return apiRequest<void>({ path: "/warehouses/bins/reorder", method: "PATCH", body: items });
}
