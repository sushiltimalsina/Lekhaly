"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  FileText,
  ArrowRightLeft,
  Wallet,
  ShoppingCart,
  History,
  Info
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listVouchers, VoucherType } from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

const VOUCHER_TYPE_METADATA: Record<string, { label: string; icon: any; color: string }> = {
  sales_invoice: { label: "Sales Invoice", icon: FileText, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  sales_return: { label: "Sales Return", icon: History, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
  purchase: { label: "Purchase", icon: ShoppingCart, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
  purchase_return: { label: "Purchase Return", icon: History, color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20" },
  receipt: { label: "Receipt", icon: Wallet, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  payment: { label: "Payment", icon: Wallet, color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20" },
  journal: { label: "Journal", icon: ArrowRightLeft, color: "text-slate-600 bg-slate-50 dark:bg-slate-900/20" },
  opening: { label: "Opening", icon: Info, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
  reversal: { label: "Reversal", icon: History, color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
};

export default function VouchersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dateFormat } = useDateFormat();

  const [loading, setLoading] = React.useState(true);
  const [vouchers, setVouchers] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState({
    q: searchParams.get("q") || "",
    type: searchParams.get("type") || "all",
    status: searchParams.get("status") || "all",
    from: null as Date | null,
    to: null as Date | null,
  });

  async function load() {
    setLoading(true);
    try {
      const res = await listVouchers({
        q: filters.q || undefined,
        type: filters.type === "all" ? undefined : (filters.type as VoucherType),
        status: filters.status === "all" ? undefined : (filters.status as any),
        from: filters.from || undefined,
        to: filters.to || undefined,
        take: 50,
      });
      const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
      setVouchers(list);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const filterOptions = [
    {
      key: "type",
      label: "Category",
      options: [
        { value: "all", label: "All Types" },
        ...Object.entries(VOUCHER_TYPE_METADATA).map(([val, meta]) => ({ value: val, label: meta.label }))
      ]
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "posted", label: "Posted" },
        { value: "void", label: "Void" },
      ]
    }
  ];

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      type: newFilters.type?.[0] || prev.type,
      status: newFilters.status?.[0] || prev.status,
      from: newFilters.dateRange?.from || null,
      to: newFilters.dateRange?.to || null,
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vouchers"
        description="View and manage all financial transactions and vouchers."
      />

      {/* System Navigation/Actions Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Button onClick={() => router.push("/journals/create")} variant="ghost" className="rounded-xl hover:bg-white dark:hover:bg-slate-700 h-9 font-medium text-xs">
          <Plus className="mr-2 h-3.5 w-3.5" />
          New Journal
        </Button>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
        <Button onClick={() => router.push("/sales/create")} variant="ghost" className="rounded-xl hover:bg-white dark:hover:bg-slate-700 h-9 font-medium text-xs text-slate-600 dark:text-slate-300">
          Sales Invoice
        </Button>
        <Button onClick={() => router.push("/purchases/create")} variant="ghost" className="rounded-xl hover:bg-white dark:hover:bg-slate-700 h-9 font-medium text-xs text-slate-600 dark:text-slate-300">
          Purchase Bill
        </Button>
        <Button onClick={() => router.push("/receipts/create")} variant="ghost" className="rounded-xl hover:bg-white dark:hover:bg-slate-700 h-9 font-medium text-xs text-slate-600 dark:text-slate-300">
          Receipt
        </Button>
        <Button onClick={() => router.push("/payments/create")} variant="ghost" className="rounded-xl hover:bg-white dark:hover:bg-slate-700 h-9 font-medium text-xs text-slate-600 dark:text-slate-300">
          Payment
        </Button>
      </div>

      <AdvancedFilterBar
        onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
        searchValue={filters.q}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
      />

      {/* Content */}
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        {loading && vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest text-[10px]">Filtering Records...</p>
          </div>
        ) : vouchers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date Identity</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Voucher Reference</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Category</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Party Context</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Debit/Credit</th>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {vouchers.map((v) => {
                  const meta = VOUCHER_TYPE_METADATA[v.voucherType] || { label: v.voucherType, icon: FileText, color: "text-slate-600 bg-slate-50" };
                  const dateInfo = getDateDisplay({ ad: v.voucherDate, bs: v.voucherDateBs, format: dateFormat });
                  const Icon = meta.icon;

                  return (
                    <tr
                      key={v.id}
                      onClick={() => router.push(`/vouchers/${v.id}`)}
                      className="group cursor-pointer hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{dateInfo.primary}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{dateInfo.secondary}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {v.voucherNumber || v.voucherNo || "DRAFT-" + v.id.slice(0, 4)}
                          </span>
                          {v.referenceNo && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {v.referenceNo}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm", meta.color)}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col max-w-[200px]">
                          <span className="truncate font-bold text-slate-700 dark:text-slate-200">
                            {v.party?.name || v.partyName || "General Entry"}
                          </span>
                          <span className="truncate text-[11px] text-slate-400 italic font-medium">
                            {v.memo || "No memo linked"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <span className="font-black text-slate-900 dark:text-white tabular-nums text-sm">
                          <MoneyText value={v.amount || 0} />
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <StatusBadge status={v.status as DocStatus} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <div className="max-w-[280px] space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm text-indigo-600">No Vouchers Found</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">No transactions match your current filter parameters. Try expanding your date range or clearing category filters.</p>
            </div>
            <Button
              onClick={() => setFilters({ q: "", type: "all", status: "all", from: null, to: null })}
              variant="outline"
              className="rounded-2xl h-10 px-6 font-black text-[10px] uppercase tracking-widest border-2"
            >
              Reset Audit Filters
            </Button>
          </div>
        )}
      </div>

      {vouchers.length > 0 && (
        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          <p>Audit Log: {vouchers.length} transactions in view</p>
          <div className="flex items-center gap-1.5 font-bold text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Synced with General Ledger</span>
          </div>
        </div>
      )}
    </div>
  );
}
