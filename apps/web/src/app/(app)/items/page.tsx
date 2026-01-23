"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type ItemRow = {
  id: string;
  name: string;
  sku?: string;
  rate?: number;
  stock?: number;
};

export default function ItemsPage() {
  const [q, setQ] = React.useState("");
  const [rows] = React.useState<ItemRow[]>([
    { id: "i1", name: "Premium Basmati Rice (25kg)", sku: "RICE-BAS-25", rate: 1850, stock: 12 },
    { id: "i2", name: "Sunflower Cooking Oil (5L)", sku: "OIL-SUN-5", rate: 1450, stock: 6 },
    { id: "i3", name: "Brown Sugar (1kg)", sku: "SUG-BRN-1", rate: 120, stock: 45 },
    { id: "i4", name: "Whole Wheat Atta (10kg)", sku: "ATTA-WHT-10", rate: 650, stock: 20 },
    { id: "i5", name: "Masala Tea Pack (500g)", sku: "TEA-MAS-500", rate: 450, stock: 15 },
  ]);

  const filtered = rows.filter((r) => {
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
            <div className="text-xs text-muted-foreground">{r.sku}</div>
          </div>
        </div>
      ),
    },
    { key: "sku", header: "SKU", cell: (r) => <div className="mono-numbers text-muted-foreground">{r.sku ?? "—"}</div>, width: 140 },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      cell: (r) => <span className="font-medium"><MoneyText value={Number(r.rate ?? 0)} /></span>,
      width: 140,
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      cell: (r) => (
        <span className={cn(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mono-numbers",
          (r.stock || 0) < 10 ? "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400"
        )}>
          {Number(r.stock ?? 0)}
        </span>
      ),
      width: 120,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      cell: () => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Items Inventory"
        description="Manage your product catalog, prices, and stock levels."
        actions={
          <Button className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            New Item
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Metric Cards (Optional for Items page, adds premium feel) */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Total Items</div>
            <div className="mt-1 text-2xl font-bold">142</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Low Stock</div>
            <div className="mt-1 text-2xl font-bold text-red-600">8</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Total Value</div>
            <div className="mt-1 text-2xl font-bold">
              <MoneyText value={452000} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
          <FiltersBar
            className="bg-transparent p-0 mb-0"
            left={
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, SKU..."
                  className="pl-9"
                />
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                <Button variant="outline">Import</Button>
                <Button variant="outline">Export</Button>
              </div>
            }
          />
          <DataTable rows={filtered} columns={columns} className="border-0 shadow-none" />
        </div>
      </div>
    </div>
  );
}

