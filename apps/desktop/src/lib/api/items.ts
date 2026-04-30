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
  code?: string | null; // Alias for SKU or separate field if needed. Using SKU as code in UI often.
  hsCode?: string | null;
  unit?: string | null;
  baseUnit?: string | null;
  uomConversions?: Array<{ unit: string; factor: number; isBase?: boolean }>;
  type?: ItemType;
  salesPrice?: number | null;
  purchasePrice?: number | null;
  reorderLevel?: number | null;
  safetyStock?: number | null;
  incomeAccountId?: string | null;
  expenseAccountId?: string | null;
  taxCodeId?: string | null;
  isActive?: boolean;
  stock?: number;
};

export async function createItem(input: CreateItemInput) {
  return apiRequest<ItemRecord>({
    path: "/items",
    method: "POST",
    body: input,
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
