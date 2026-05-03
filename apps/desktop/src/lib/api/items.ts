import { apiRequest } from "./client";

export type ItemRecord = {
  id: string;
  name: string;
  code?: string;
  sku?: string;
  hsCode?: string;
  unit?: string;
  baseUnit?: string;
  type?: "goods" | "services";
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
  minStockLevel?: number;
  reorderQty?: number;
  trackInventory?: boolean;
  isSerialized?: boolean;
  isKit?: boolean;
  tracksBatch?: boolean;
  tracksLot?: boolean;
  tracksExpiry?: boolean;
  components?: Array<{ componentId: string; qty: number }>;
  stock?: number;
};

export type ItemType = "goods" | "services";

export async function createItem(body: Partial<ItemRecord>) {
  return apiRequest({ method: "POST", path: "/items", body });
}

export async function updateItem(id: string, body: Partial<ItemRecord>) {
  return apiRequest({ method: "PUT", path: `/items/${id}`, body });
}

export async function getItem(id: string): Promise<ItemRecord> {
  return apiRequest({ path: `/items/${id}` });
}

export async function listItems(query?: any): Promise<ItemRecord[] | { items: ItemRecord[]; total: number }> {
  return apiRequest({ path: "/items", query });
}

export async function getItemStock(id: string, query?: any) {
  return apiRequest({ path: `/items/${id}/stock`, query });
}

export async function removeItem(id: string) {
  return apiRequest({ method: "DELETE", path: `/items/${id}` });
}

export async function restoreItem(id: string) {
  return apiRequest({ method: "POST", path: `/items/${id}/restore` });
}

export async function assembleItem(
  id: string,
  qty: number,
  memo?: string,
  components?: Array<{ componentId: string; consumedQty: number }>,
  sundries?: Array<{ sundryId: string; amount: number }>
) {
  return apiRequest({
    method: "POST",
    path: `/items/${id}/assemble`,
    body: { qty, memo, components, sundries }
  });
}

export async function disassembleItem(
  id: string,
  qty: number,
  components?: Array<{ componentId: string; consumedQty: number }>,
  sundries?: Array<{ sundryId: string; amount: number }>
) {
  return apiRequest({
    method: "POST",
    path: `/items/${id}/disassemble`,
    body: { qty, components, sundries }
  });
}
