// apps/web/src/lib/api/items.ts

import { apiRequest } from "./client";

export type ItemType = "goods" | "services";

export type CreateItemInput = {
  name: string;
  sku?: string;
  hsCode?: string;
  unit?: string;
  baseUnit?: string;
  uomConversions?: Array<{ unit: string; factor: number; isBase?: boolean }>;
  type?: ItemType;
  salesPrice?: number;
  purchasePrice?: number;
  reorderLevel?: number;
  safetyStock?: number;
  minStockLevel?: number;
  reorderQty?: number;
  isSerialized?: boolean;
  isKit?: boolean;
  components?: Array<{ componentId: string; qty: number }>;
  openingQty?: number;
  openingPrice?: number;
  groupId?: string;
  incomeAccountId?: string;
  expenseAccountId?: string;
  taxCodeId?: string;
  taxCodeIds?: string[];
};

export type ItemRecord = {
  id: string;
  name: string;
  sku?: string | null;
  code?: string | null;
  hsCode?: string | null;
  unit?: string | null;
  baseUnit?: string | null;
  uomConversions?: Array<{ unit: string; factor: number; isBase?: boolean }>;
  type?: ItemType;
  salesPrice?: number | null;
  purchasePrice?: number | null;
  reorderLevel?: number | null;
  safetyStock?: number | null;
  minStockLevel?: number | null;
  reorderQty?: number | null;
  isSerialized?: boolean;
  isKit?: boolean;
  isLowStock?: boolean;
  incomeAccountId?: string | null;
  expenseAccountId?: string | null;
  taxCodeId?: string | null;
  isActive?: boolean;
  stock?: number;
  components?: Array<{
    id: string;
    componentId: string;
    qty: number;
    component: { id: string; name: string; sku?: string | null; unit?: string | null };
  }>;
};

export async function createItem(input: CreateItemInput) {
  return apiRequest<ItemRecord>({
    path: "/items",
    method: "POST",
    body: input,
  });
}

export async function getItem(id: string) {
  return apiRequest<ItemRecord>({
    path: `/items/${id}`,
    method: "GET",
  });
}

export async function listItems(params?: { q?: string; skip?: number; take?: number }) {
  const safeParams = params?.take && params.take > 1000 ? { ...params, take: 1000 } : params;
  return apiRequest<ItemRecord[]>({
    path: "/items",
    method: "GET",
    query: safeParams,
  });
}

export async function deleteItem(id: string) {
  return apiRequest<void>({
    path: `/items/${id}`,
    method: "DELETE",
  });
}

export async function assembleItem(id: string, qty: number, memo?: string) {
  return apiRequest<void>({
    path: `/items/${id}/assemble`,
    method: "POST",
    body: { qty, memo },
  });
}

export async function disassembleItem(id: string, qty: number) {
  return apiRequest<void>({
    path: `/items/${id}/disassemble`,
    method: "POST",
    body: { qty },
  });
}
