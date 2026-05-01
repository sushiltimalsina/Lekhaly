"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, BookOpen, Layers, ArrowUpRight, ArrowDownRight, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

type CoaRow = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "income" | "expense" | "equity";
  sub_type?: string;
};

export default function CoaPage() {
  const [q, setQ] = React.useState("");
  const [rows] = React.useState<CoaRow[]>([
    { id: "a1", code: "1000", name: "Cash in Hand", type: "asset", sub_type: "Current Asset" },
    { id: "a2", code: "1100", name: "NIC Asia Bank - 001", type: "asset", sub_type: "Bank" },
    { id: "a3", code: "1200", name: "Accounts Receivable", type: "asset", sub_type: "Current Asset" },
    { id: "l1", code: "2000", name: "Accounts Payable", type: "liability", sub_type: "Current Liability" },
    { id: "l2", code: "2100", name: "VAT Payable", type: "liability", sub_type: "Tax" },
    { id: "eq1", code: "3000", name: "Owner's Equity", type: "equity", sub_type: "Capital" },
    { id: "i1", code: "4000", name: "Sales Revenue", type: "income", sub_type: "Operating Income" },
    { id: "i2", code: "4500", name: "Professional Services", type: "income", sub_type: "Service Income" },
    { id: "e1", code: "5000", name: "Office Rent", type: "expense", sub_type: "Fixed Expense" },
    { id: "e2", code: "5100", name: "Salary & Wages", type: "expense", sub_type: "Personnel" },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.code} ${r.name} ${r.type} ${r.sub_type ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<CoaRow>[] = [
    {
      key: "code",
      header: "Code",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className="mono-numbers font-medium text-muted-foreground">{r.code}</span>
        </div>
      ),
      width: 100
    },
    {
      key: "name",
      header: "Account Name",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-2 w-2 rounded-full",
            r.type === 'asset' ? "bg-blue-500" :
              r.type === 'liability' ? "bg-orange-500" :
                r.type === 'income' ? "bg-emerald-500" :
                  r.type === 'expense' ? "bg-red-500" : "bg-purple-500"
          )} />
          <div>
            <div className="font-medium text-foreground">{r.name}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{r.sub_type}</div>
          </div>
        </div>
      )
    },
    {
      key: "type",
      header: "Category",
      cell: (r) => (
        <span className={cn(
          "inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
          r.type === 'asset' ? "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-900/20 dark:text-blue-400" :
            r.type === 'liability' ? "bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-900/20 dark:text-orange-400" :
              r.type === 'income' ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-900/20 dark:text-emerald-400" :
                r.type === 'expense' ? "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/20 dark:text-red-400" :
                  "bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-900/20 dark:text-purple-400"
        )}>
          {r.type}
        </span>
      ),
      width: 140,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      cell: () => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Structure your financial system with a professional chart of accounts."
        actions={
          <Button className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-5">
          <StatCard title="Assets" count={42} type="asset" />
          <StatCard title="Liabilities" count={18} type="liability" />
          <StatCard title="Equity" count={5} type="equity" />
          <StatCard title="Income" count={12} type="income" />
          <StatCard title="Expenses" count={35} type="expense" />
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
                  placeholder="Search by code or name..."
                  className="pl-9"
                />
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                <Button variant="outline">Hierarchy View</Button>
                <Button variant="outline">Import COA</Button>
              </div>
            }
          />
          <DataTable rows={filtered} columns={columns} className="border-0 shadow-none" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, type }: { title: string, count: number, type: string }) {
  const colors: any = {
    asset: "border-l-blue-500 text-blue-600",
    liability: "border-l-orange-500 text-orange-600",
    equity: "border-l-purple-500 text-purple-600",
    income: "border-l-emerald-500 text-emerald-600",
    expense: "border-l-red-500 text-red-600"
  };

  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm border-l-4", colors[type])}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{count}</div>
    </div>
  );
}
