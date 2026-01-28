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
import { Input } from "@/components/ui/input";

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
  const [search, setSearch] = React.useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = React.useState<string>(searchParams.get("type") || "all");

  async function load() {
    setLoading(true);
    try {
      const res = await listVouchers({
        q: search || undefined,
        type: typeFilter === "all" ? undefined : (typeFilter as VoucherType),
        take: 50,
      });
      // The API might return { items: [] } or just []
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
  }, [search, typeFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vouchers"
        description="View and manage all financial transactions and vouchers."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/journals/create")} variant="outline" className="rounded-2xl border-2 hover:bg-slate-50">
              <Plus className="mr-2 h-4 w-4" />
              New Journal
            </Button>
            <Button onClick={() => router.push("/receipts/create")} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
              <Plus className="mr-2 h-4 w-4" />
              Receipt
            </Button>
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Search by number, memo or party..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:border-indigo-500 transition-all dark:bg-slate-800/30 dark:border-slate-800 dark:focus:border-indigo-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 rounded-2xl border-slate-100 bg-slate-50/50 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800/30 dark:border-slate-800 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <option value="all">All Types</option>
              {Object.entries(VOUCHER_TYPE_METADATA).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        {loading && vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-slate-500 animate-pulse">Loading vouchers...</p>
          </div>
        ) : vouchers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Date</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Voucher No / Reference</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Type</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Party / Account</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Amount</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-center">Status</th>
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
                      className="group cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{dateInfo.primary}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{dateInfo.secondary}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {v.voucherNumber || v.voucherNo || "DRAFT-" + v.id.slice(0, 4)}
                          </span>
                          {v.referenceNo && (
                            <span className="text-xs text-slate-400">Ref: {v.referenceNo}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm", meta.color)}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col max-w-[200px]">
                          <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                            {v.party?.name || v.partyName || "—"}
                          </span>
                          <span className="truncate text-xs text-slate-400 italic">
                            {v.memo || "No description"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-black text-slate-900 dark:text-white tabular-nums">
                          <MoneyText value={v.amount || 0} />
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={v.status as DocStatus} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
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
            <div className="max-w-xs space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white">No vouchers found</h3>
              <p className="text-sm text-slate-500">We couldn't find any vouchers matching your search criteria. Try adjusting your filters.</p>
            </div>
            <Button onClick={() => { setSearch(""); setTypeFilter("all"); }} variant="link" className="text-indigo-600 font-bold">
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {vouchers.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <p>Showing {vouchers.length} vouchers</p>
          <p>Tip: Click on a row to view details, post or print the voucher.</p>
        </div>
      )}
    </div>
  );
}
