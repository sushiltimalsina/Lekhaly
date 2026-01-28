"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search,
    Plus,
    ChevronRight,
    Wallet,
    ArrowRight,
    Filter,
    Calendar,
    User
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listVouchers } from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReceiptsListPage() {
    const router = useRouter();
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [vouchers, setVouchers] = React.useState<any[]>([]);
    const [search, setSearch] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);

    async function load() {
        setLoading(true);
        try {
            const res = await listVouchers({
                type: "receipt",
                q: search || undefined,
                take: 50,
            });
            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            setVouchers(list);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load receipts");
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Money Receipts"
                description="Monitor and manage all incoming payments and collections."
                actions={
                    <Button
                        onClick={() => router.push("/receipts/create")}
                        className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-8 h-11 transition-all active:scale-95 border-none"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Receipt
                    </Button>
                }
            />

            {/* Filters Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                        placeholder="Search by payer, receipt number or memo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 rounded-2xl bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:border-emerald-500 transition-all dark:bg-slate-800/30 dark:border-slate-800 dark:focus:border-emerald-400 font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Collection Summary: All Time</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {loading && vouchers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-900/30"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Syncing Collections...</p>
                    </div>
                ) : vouchers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date (AD/BS)</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Receipt Identity</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Payer / Description</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount Received</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {vouchers.map((v) => {
                                    const dateInfo = getDateDisplay({ ad: v.voucherDate, bs: v.voucherDateBs, format: dateFormat });

                                    return (
                                        <tr
                                            key={v.id}
                                            onClick={() => router.push(`/vouchers/${v.id}`)}
                                            className="group cursor-pointer hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors"
                                        >
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{dateInfo.primary}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{dateInfo.secondary}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-800/50 text-emerald-600">
                                                        <Wallet className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                                            {v.voucherNumber || v.voucherNo || `RCPT-D-${v.id.slice(0, 4)}`}
                                                        </span>
                                                        {v.referenceNo && (
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {v.referenceNo}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col max-w-[240px]">
                                                    <span className="truncate font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                        {v.party?.name || v.partyName || "General Collection"}
                                                    </span>
                                                    <span className="truncate text-xs text-slate-400 font-medium italic">
                                                        {v.memo || "No memo attached"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <span className="font-black text-emerald-600 tabular-nums text-base">
                                                    <MoneyText value={v.amount || 0} />
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <StatusBadge status={v.status as DocStatus} />
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 px-6 text-center space-y-4">
                        <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-4 border-dotted border-slate-200 dark:border-slate-800">
                            <Wallet className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm text-emerald-600">No Receipts</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Incoming payments recorded via the Receipt module will appear here.</p>
                        </div>
                        <Button onClick={() => router.push("/receipts/create")} className="bg-emerald-600 rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                            New Receipt
                        </Button>
                    </div>
                )}
            </div>

            {vouchers.length > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    <p>Collection Audit: {vouchers.length} receipts found</p>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>All payments are synced with general ledger</span>
                    </div>
                </div>
            )}
        </div>
    );
}
