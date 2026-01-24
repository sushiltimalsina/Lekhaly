// apps/web/src/lib/api/inventory.ts

import { apiRequest } from "./client";

export type StockReportRow = {
  id: string;
  name: string;
  sku?: string | null;
  hsCode?: string | null;
  unit?: string | null;
  type: "goods" | "services";
  parentGroup: string;
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
