"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getStockReport, StockReportRow } from "@/lib/api/inventory";

type ItemRow = StockReportRow;

export default function ItemsPage() {
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "goods" | "services">("all");
  const [rows, setRows] = React.useState<ItemRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getStockReport()
      .then((data) => {
        if (!alive) return;
        setRows(data);
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(e?.message ?? "Failed to load stock report");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = rows.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (!q.trim()) return true;
    return `${r.name} ${r.sku ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<ItemRow>[] = [
    {
      key: "name",
      header: "Item Details",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-foreground">{r.name}</div>
            <div className="text-xs text-muted-foreground">
              {r.sku ?? "—"} {r.hsCode ? `• HS ${r.hsCode}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "hsCode",
      header: "HS Code",
      cell: (r) => <div className="text-muted-foreground">{r.hsCode ?? "—"}</div>,
      width: 110,
    },
    { key: "type", header: "Type", cell: (r) => <div className="text-muted-foreground capitalize">{r.type}</div>, width: 90 },
    { key: "parentGroup", header: "Parent Group", cell: (r) => <div className="text-muted-foreground">{r.parentGroup ?? "—"}</div>, width: 180 },
    { key: "unit", header: "Unit", cell: (r) => <div className="text-muted-foreground">{r.unit ?? "—"}</div>, width: 80 },
    {
      key: "openingQty",
      header: "Op.Qty",
      align: "right",
      cell: (r) => <span className="mono-numbers">{r.openingQty || 0}</span>,
      width: 90,
    },
    {
      key: "openingAvgPrice",
      header: "Avg.Price",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.openingAvgPrice ?? 0)} />,
      width: 120,
    },
    {
      key: "openingAmt",
      header: "Op.Amt.",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.openingAmt ?? 0)} />,
      width: 130,
    },
    {
      key: "purchaseQty",
      header: "Purc.",
      align: "right",
      cell: (r) => <span className="mono-numbers">{r.purchaseQty || 0}</span>,
      width: 90,
    },
    {
      key: "purchaseAvgPrice",
      header: "Avg.Price",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.purchaseAvgPrice ?? 0)} />,
      width: 120,
    },
    {
      key: "purchaseAmt",
      header: "Amt.In",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.purchaseAmt ?? 0)} />,
      width: 130,
    },
    {
      key: "saleQty",
      header: "Sale",
      align: "right",
      cell: (r) => <span className="mono-numbers">{r.saleQty || 0}</span>,
      width: 90,
    },
    {
      key: "saleAvgPrice",
      header: "Avg.Price",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.saleAvgPrice ?? 0)} />,
      width: 120,
    },
    {
      key: "saleAmt",
      header: "Amt.Out",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.saleAmt ?? 0)} />,
      width: 130,
    },
    {
      key: "closingQty",
      header: "Cl. Qty",
      align: "right",
      cell: (r) => (
        <span className={cn(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mono-numbers",
          (r.closingQty || 0) < 10
            ? "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/20 dark:text-red-400"
            : "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400"
        )}>
          {Number(r.closingQty ?? 0)}
        </span>
      ),
      width: 120,
    },
    {
      key: "closingPrice",
      header: "Price",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.closingPrice ?? 0)} />,
      width: 120,
    },
    {
      key: "closingAmt",
      header: "Cl. Amt.",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.closingAmt ?? 0)} />,
      width: 130,
    },
  ];

  const goodsRows = rows.filter((r) => r.type === "goods");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Items Inventory"
        description="Manage your product catalog, prices, and stock levels."
        actions={
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/items/new">
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Total Items</div>
            <div className="mt-1 text-2xl font-bold">{rows.length}</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Low Stock (Goods)</div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {goodsRows.filter((r) => (r.closingQty ?? 0) < 10).length}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Total Value (Goods)</div>
            <div className="mt-1 text-2xl font-bold">
              <MoneyText value={goodsRows.reduce((sum, r) => sum + Number(r.closingAmt ?? 0), 0)} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
          <FiltersBar
            className="bg-transparent p-0 mb-0"
            left={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, SKU..."
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {(["all", "goods", "services"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                        typeFilter === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {t === "all" ? "All" : t}
                    </button>
                  ))}
                </div>
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                <Button variant="outline">Import</Button>
                <Button variant="outline">Export</Button>
              </div>
            }
          />
          {error ? (
            <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <DataTable rows={filtered} columns={columns} loading={loading} className="border-0 shadow-none" />
        </div>
      </div>
    </div>
  );
}
