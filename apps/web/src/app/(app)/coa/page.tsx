"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";

type CoaRow = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "income" | "expense" | "equity";
};

export default function CoaPage() {
  const [q, setQ] = React.useState("");
  const [rows] = React.useState<CoaRow[]>([
    { id: "a1", code: "1000", name: "Cash", type: "asset" },
    { id: "a2", code: "1100", name: "Bank", type: "asset" },
    { id: "i1", code: "4000", name: "Sales", type: "income" },
    { id: "e1", code: "5000", name: "Office Expense", type: "expense" },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.code} ${r.name} ${r.type}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<CoaRow>[] = [
    { key: "code", header: "Code", cell: (r) => <div className="mono-numbers">{r.code}</div>, width: 120 },
    { key: "name", header: "Account", cell: (r) => <div className="font-medium">{r.name}</div> },
    {
      key: "type",
      header: "Type",
      cell: (r) => (
        <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
          {r.type}
        </span>
      ),
      width: 140,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 120,
      cell: () => (
        <button className="rounded-xl border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="Accounts used for vouchers, invoices, taxes and reporting"
        actions={
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
            New Account
          </button>
        }
      />

      <FiltersBar
        left={
          <div className="w-full sm:w-[320px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search accounts…"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        }
        right={
          <button className="rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted">
            Import COA
          </button>
        }
      />

      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}
