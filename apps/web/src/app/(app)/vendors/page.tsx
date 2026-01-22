"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";

type VendorRow = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  payable?: number;
};

export default function VendorsPage() {
  const [q, setQ] = React.useState("");
  const [rows] = React.useState<VendorRow[]>([
    { id: "v1", name: "Everest Distributors", phone: "98XXXXXXXX", payable: 42000 },
    { id: "v2", name: "Kathmandu Wholesale", phone: "98XXXXXXXX", payable: 0 },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.name} ${r.phone ?? ""} ${r.email ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<VendorRow>[] = [
    { key: "name", header: "Vendor", cell: (r) => <div className="font-medium">{r.name}</div> },
    { key: "phone", header: "Phone", cell: (r) => <div className="mono-numbers">{r.phone ?? "—"}</div> },
    { key: "email", header: "Email", cell: (r) => <div className="truncate">{r.email ?? "—"}</div> },
    {
      key: "payable",
      header: <span className="w-full block text-right">Payable</span>,
      align: "right",
      cell: (r) => <MoneyText value={Number(r.payable ?? 0)} />,
      width: 160,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 120,
      cell: () => (
        <button className="rounded-xl border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Manage vendors and payables"
        actions={
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
            New Vendor
          </button>
        }
      />

      <FiltersBar
        left={
          <div className="w-full sm:w-[320px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search vendors…"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        }
      />

      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}
