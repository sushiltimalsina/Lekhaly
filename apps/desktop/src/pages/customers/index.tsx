// apps/desktop/src/pages/customers/index.tsx
import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Plus, Search, MoreHorizontal, Mail, Phone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
    { id: "c1", name: "ABC Traders", phone: "9841234567", email: "abc@traders.com", balance: 12500 },
    { id: "c2", name: "Himal Suppliers", phone: "9851098765", email: "himal@suppliers.np", balance: -5000 },
    { id: "c3", name: "Everest Enterprises", phone: "01-4433221", email: "info@everest.com", balance: 0 },
    { id: "c4", name: "Kathmandu Mart", phone: "9808877665", email: "mart@ktm.com", balance: 45000 },
    { id: "c5", name: "Patan General Store", phone: "01-5544332", email: "patan@store.com", balance: 1200 },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.name} ${r.phone ?? ""} ${r.email ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<CustomerRow>[] = [
    {
      key: "name",
      header: "Customer Details",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs ring-1 ring-blue-500/20">
            {r.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-medium text-foreground">{r.name}</div>
            <div className="text-xs text-muted-foreground">ID: {r.id.toUpperCase()}</div>
          </div>
        </div>
      )
    },
    {
      key: "contact",
      header: "Contact",
      cell: (r) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group">
            <Phone className="h-3 w-3" />
            <span>{r.phone ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group">
            <Mail className="h-3 w-3" />
            <span>{r.email ?? "—"}</span>
          </div>
        </div>
      )
    },
    {
      key: "balance",
      header: "Current Balance",
      align: "right",
      cell: (r) => (
        <span className={cn(
          "font-semibold tabular-nums",
          (r.balance || 0) > 0 ? "text-red-600 dark:text-red-400" : (r.balance || 0) < 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
          <MoneyText value={Math.abs(Number(r.balance ?? 0))} />
          <span className="ml-1 text-[10px] uppercase opacity-70">
            {(r.balance || 0) > 0 ? "DR" : (r.balance || 0) < 0 ? "CR" : ""}
          </span>
        </span>
      ),
      width: 160,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      cell: () => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
            <ExternalLink className="h-4 w-4" />
          </Button>
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
        title="Customers"
        description="Manage your customer relationships and track outstanding balances."
        actions={
          <Link to="/customers/new">
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              New Customer
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-blue-500">
            <div className="text-xs font-medium text-muted-foreground">Total Customers</div>
            <div className="mt-1 text-2xl font-bold">428</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-red-500">
            <div className="text-xs font-medium text-muted-foreground">Total Receivables</div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              <MoneyText value={1250000} />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-green-500">
            <div className="text-xs font-medium text-muted-foreground">Total Collections</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              <MoneyText value={840000} />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-purple-500">
            <div className="text-xs font-medium text-muted-foreground">Active This Month</div>
            <div className="mt-1 text-2xl font-bold">85</div>
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
                  placeholder="Search by name, phone or email..."
                  className="pl-9"
                />
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                <Button variant="outline">Statement</Button>
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
