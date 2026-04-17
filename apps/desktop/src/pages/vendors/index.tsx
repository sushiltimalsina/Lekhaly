"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Plus, Search, MoreHorizontal, Building2, Mail, Phone, ExternalLink, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
    { id: "v1", name: "Everest Distributors", phone: "01-4411223", email: "sales@everestdist.com", payable: 42000 },
    { id: "v2", name: "Kathmandu Wholesale", phone: "9841987654", email: "info@ktmwholesale.np", payable: 0 },
    { id: "v3", name: "Modern Paper Mills", phone: "01-5522334", email: "orders@modernpaper.com", payable: 8500 },
    { id: "v4", name: "Quality Stationery", phone: "9801234567", email: "info@quality.np", payable: 12400 },
    { id: "v5", name: "Global Logistics", phone: "01-4455667", email: "accounts@globallog.com", payable: -1500 },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.name} ${r.phone ?? ""} ${r.email ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<VendorRow>[] = [
    {
      key: "name",
      header: "Vendor Details",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs ring-1 ring-purple-500/20">
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
            <span>{r.phone ?? "â€”"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group">
            <Mail className="h-3 w-3" />
            <span>{r.email ?? "â€”"}</span>
          </div>
        </div>
      )
    },
    {
      key: "payable",
      header: "Current Payable",
      align: "right",
      cell: (r) => (
        <span className={cn(
          "font-semibold tabular-nums",
          (r.payable || 0) > 0 ? "text-orange-600 dark:text-orange-400" : (r.payable || 0) < 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
          <MoneyText value={Math.abs(Number(r.payable ?? 0))} />
          <span className="ml-1 text-[10px] uppercase opacity-70">
            {(r.payable || 0) > 0 ? "CR" : (r.payable || 0) < 0 ? "DR" : ""}
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
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple/10 hover:text-purple-600">
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
        title="Vendors"
        description="Manage your suppliers and track pending payables."
        actions={
          <Link to="/vendors/new">
            <Button className="shadow-lg shadow-primary/20 bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              New Vendor
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-purple-500">
            <div className="text-xs font-medium text-muted-foreground">Total Vendors</div>
            <div className="mt-1 text-2xl font-bold">152</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-orange-500">
            <div className="text-xs font-medium text-muted-foreground">Total Payables</div>
            <div className="mt-1 text-2xl font-bold text-orange-600">
              <MoneyText value={845000} />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-blue-500">
            <div className="text-xs font-medium text-muted-foreground">Recent Payments</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">
              <MoneyText value={520000} />
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-amber-500">
            <div className="text-xs font-medium text-muted-foreground">Top Suppliers</div>
            <div className="mt-1 text-2xl font-bold">12</div>
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
                <Button variant="outline">Purchases</Button>
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


