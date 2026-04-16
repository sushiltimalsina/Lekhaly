"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Plus, Search, Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getStockReport, StockReportRow } from "@/lib/api/inventory";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddGroupDialog from "@/components/app/add-group-dialog";

type ItemRow = StockReportRow;

export default function ItemsPage() {
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "goods" | "services">("all");
  const [sortBy, setSortBy] = React.useState<
    | "alpha_asc"
    | "alpha_desc"
    | "closing_qty_asc"
    | "closing_qty_desc"
    | "closing_price_asc"
    | "closing_price_desc"
    | "closing_amt_asc"
    | "closing_amt_desc"
    | "opening_price_asc"
    | "opening_price_desc"
    | "opening_amt_asc"
    | "opening_amt_desc"
  >("alpha_asc");
  const [rows, setRows] = React.useState<ItemRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);

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

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await getStockReport();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load stock report");
    } finally {
      setLoading(false);
    }
  }

  const filtered = rows.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (!q.trim()) return true;
    return `${r.name} ${r.sku ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "alpha_desc":
        return b.name.localeCompare(a.name);
      case "closing_qty_asc":
        return Number(a.closingQty ?? 0) - Number(b.closingQty ?? 0);
      case "closing_qty_desc":
        return Number(b.closingQty ?? 0) - Number(a.closingQty ?? 0);
      case "closing_price_asc":
        return Number(a.closingPrice ?? 0) - Number(b.closingPrice ?? 0);
      case "closing_price_desc":
        return Number(b.closingPrice ?? 0) - Number(a.closingPrice ?? 0);
      case "closing_amt_asc":
        return Number(a.closingAmt ?? 0) - Number(b.closingAmt ?? 0);
      case "closing_amt_desc":
        return Number(b.closingAmt ?? 0) - Number(a.closingAmt ?? 0);
      case "opening_price_asc":
        return Number(a.openingAvgPrice ?? 0) - Number(b.openingAvgPrice ?? 0);
      case "opening_price_desc":
        return Number(b.openingAvgPrice ?? 0) - Number(a.openingAvgPrice ?? 0);
      case "opening_amt_asc":
        return Number(a.openingAmt ?? 0) - Number(b.openingAmt ?? 0);
      case "opening_amt_desc":
        return Number(b.openingAmt ?? 0) - Number(a.openingAmt ?? 0);
      case "alpha_asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const columns: Column<ItemRow>[] = [
    {
      key: "sno",
      header: "S.No.",
      align: "center",
      cell: (_r, idx) => (
        <span className="mono-numbers text-muted-foreground">{idx + 1}</span>
      ),
      width: 70,
    },
    {
      key: "name",
      header: "Item Name",
      cell: (r) => <div className="font-medium text-foreground">{r.name}</div>,
      width: 200,
    },

    {
      key: "hsCode",
      header: "HS Code",
      cell: (r) => <div className="text-muted-foreground">{r.hsCode ?? "—"}</div>,
      width: 110,
    },
    { key: "type", header: "Type", cell: (r) => <div className="text-muted-foreground capitalize">{r.type}</div>, width: 90 },
    { key: "parentGroup", header: "Group", cell: (r) => <div className="text-muted-foreground">{r.parentGroup ?? "—"}</div>, width: 180 },
    { key: "unit", header: "Unit", cell: (r) => <div className="text-muted-foreground">{r.unit ?? "—"}</div>, width: 80 },
    {
      key: "openingQty",
      header: "Opening Qty",
      align: "right",
      cell: (r) => <span className="mono-numbers">{r.openingQty || 0}</span>,
      width: 90,
    },
    {
      key: "openingAvgPrice",
      header: "Average Price",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.openingAvgPrice ?? 0)} />,
      width: 120,
    },
    {
      key: "openingAmt",
      header: "Opening Amount",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.openingAmt ?? 0)} />,
      width: 130,
    },
    {
      key: "purchaseQty",
      header: "Purchase Quantity",
      align: "right",
      cell: (r) => <span className="mono-numbers">{r.purchaseQty || 0}</span>,
      width: 90,
    },
    {
      key: "purchaseAvgPrice",
      header: "Purchase Average Price",
      align: "center",
      cell: (r) => <MoneyText value={Number(r.purchaseAvgPrice ?? 0)} />,
      width: 120,
    },
    {
      key: "purchaseAmt",
      header: "Purchase Amtount",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.purchaseAmt ?? 0)} />,
      width: 130,
    },
    {
      key: "saleQty",
      header: "Sale Quantity",
      align: "right",
      cell: (r) => <span className="mono-numbers">{r.saleQty || 0}</span>,
      width: 90,
    },
    {
      key: "saleAvgPrice",
      header: "Average Sale Price",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.saleAvgPrice ?? 0)} />,
      width: 120,
    },
    {
      key: "saleAmt",
      header: "Sales Amount",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.saleAmt ?? 0)} />,
      width: 130,
    },
    {
      key: "closingQty",
      header: "Closing Quantity",
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
      header: "Closing Price",
      align: "right",
      cell: (r) => <MoneyText value={Number(r.closingPrice ?? 0)} />,
      width: 120,
    },
    {
      key: "closingAmt",
      header: "Closing Amount",
      align: "center",
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAddGroupOpen(true)} className="rounded-xl border-border/50">
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
            <Button onClick={() => setAddItemOpen(true)} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </div>
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
                      {t === "all" ? "All" : t === "goods" ? "Goods" : "Services"}
                    </button>
                  ))}
                </div>
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-md border bg-background px-3 py-2 text-xs"
                >
                  <option value="alpha_asc">Alphabetical (A–Z)</option>
                  <option value="closing_qty_asc">Closing Qty: Low → High</option>
                  <option value="closing_qty_desc">Closing Qty: High → Low</option>
                  <option value="closing_price_asc">Closing Price: Low → High</option>
                  <option value="closing_price_desc">Closing Price: High → Low</option>
                  <option value="closing_amt_asc">Closing Amount: Low → High</option>
                  <option value="closing_amt_desc">Closing Amount: High → Low</option>
                  <option value="opening_price_asc">Opening Price: Low → High</option>
                  <option value="opening_price_desc">Opening Price: High → Low</option>
                  <option value="opening_amt_asc">Opening Amount: Low → High</option>
                  <option value="opening_amt_desc">Opening Amount: High → Low</option>
                </select>
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
          <DataTable rows={sorted} columns={columns} loading={loading} className="border-0 shadow-none" />
        </div>
      </div>

      <AddItemDialog
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        onSuccess={() => {
          refresh();
        }}
      />

      <AddGroupDialog
        open={addGroupOpen}
        onClose={() => setAddGroupOpen(false)}
        onSuccess={() => {
          // No need to refresh stock report but could refresh group list if we had one
        }}
      />
    </div>
  );
}
