// apps/web/src/lib/api/items.ts

import { apiRequest } from "./client";

export type ItemType = "goods" | "services";

export type CreateItemInput = {
  name: string;
  sku?: string;
  hsCode?: string;
  unit?: string;
  type?: ItemType;
  salesPrice?: number;
  purchasePrice?: number;
  incomeAccountId?: string;
  expenseAccountId?: string;
  taxCodeId?: string;
};

export type ItemRecord = {
  id: string;
  name: string;
  sku?: string | null;
  hsCode?: string | null;
  unit?: string | null;
  type?: ItemType;
  salesPrice?: number | null;
  purchasePrice?: number | null;
  incomeAccountId?: string | null;
  expenseAccountId?: string | null;
  taxCodeId?: string | null;
  isActive?: boolean;
};

export async function createItem(input: CreateItemInput) {
  return apiRequest<ItemRecord>({
    path: "/items",
    method: "POST",
    body: input,
  });
}
