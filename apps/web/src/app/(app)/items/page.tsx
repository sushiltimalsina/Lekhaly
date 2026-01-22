"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";

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
    { id: "i1", name: "Rice (25kg)", sku: "RICE25", rate: 1850, stock: 12 },
    { id: "i2", name: "Cooking Oil (5L)", sku: "OIL5", rate: 1450, stock: 6 },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.name} ${r.sku ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<ItemRow>[] = [
    { key: "name", header: "Item", cell: (r) => <div className="font-medium">{r.name}</div> },
    { key: "sku", header: "SKU", cell: (r) => <div className="mono-numbers">{r.sku ?? "—"}</div>, width: 140 },
    {
      key: "rate",
      header: <span className="w-full block text-right">Rate</span>,
      align: "right",
      cell: (r) => <MoneyText value={Number(r.rate ?? 0)} />,
      width: 160,
    },
    {
      key: "stock",
      header: <span className="w-full block text-right">Stock</span>,
      align: "right",
      cell: (r) => <span className="mono-numbers">{Number(r.stock ?? 0)}</span>,
      width: 140,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 150,
      cell: () => (
        <div className="flex justify-end gap-2">
          <button className="rounded-xl border bg-background px-3 py-1.5 text-xs hover:bg-muted">
            Stock
          </button>
          <button className="rounded-xl border bg-background px-3 py-1.5 text-xs hover:bg-muted">
            Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Items"
        description="Manage items and inventory"
        actions={
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
            New Item
          </button>
        }
      />

      <FiltersBar
        left={
          <div className="w-full sm:w-[320px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search items…"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        }
        right={
          <button className="rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted">
            Stock Adjustment
          </button>
        }
      />

      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}
