"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";

type CustomerRow = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance?: number;
};

export default function CustomersPage() {
  const [q, setQ] = React.useState("");
  const [rows] = React.useState<CustomerRow[]>([
    { id: "c1", name: "ABC Traders", phone: "98XXXXXXXX", balance: 12500 },
    { id: "c2", name: "Himal Suppliers", phone: "98XXXXXXXX", balance: 0 },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.name} ${r.phone ?? ""} ${r.email ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<CustomerRow>[] = [
    { key: "name", header: "Customer", cell: (r) => <div className="font-medium">{r.name}</div> },
    { key: "phone", header: "Phone", cell: (r) => <div className="mono-numbers">{r.phone ?? "—"}</div> },
    { key: "email", header: "Email", cell: (r) => <div className="truncate">{r.email ?? "—"}</div> },
    {
      key: "balance",
      header: <span className="w-full block text-right">Balance</span>,
      align: "right",
      cell: (r) => <MoneyText value={Number(r.balance ?? 0)} />,
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
        title="Customers"
        description="Manage customers and view balances"
        actions={
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
            New Customer
          </button>
        }
      />

      <FiltersBar
        left={
          <div className="w-full sm:w-[320px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customers…"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        }
      />

      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}
