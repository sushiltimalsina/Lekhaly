"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search,
    Plus,
    ChevronRight,
    ArrowRightLeft,
    ArrowRight,
    Filter,
    Calendar
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

export default function JournalsListPage() {
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
                type: "journal",
                q: search || undefined,
                take: 50,
            });
            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            setVouchers(list);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load journals");
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
                title="Journal Vouchers"
                description="General ledger adjustments, depreciation, and internal transfers."
                actions={
                    <Button
                        onClick={() => router.push("/journals/create")}
                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8 h-11 transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Journal
                    </Button>
                }
            />

            {/* Filters Bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search by voucher number or memo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 rounded-2xl bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:border-indigo-500 transition-all dark:bg-slate-800/30 dark:border-slate-800 dark:focus:border-indigo-400 font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Period: All Time</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {loading && vouchers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-900/30"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest text-[10px] font-black">Syncing Ledger...</p>
                    </div>
                ) : vouchers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date (AD/BS)</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Voucher Identity</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Description</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount</th>
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
                                            className="group cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                                        >
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{dateInfo.primary}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{dateInfo.secondary}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-800/50 text-indigo-600">
                                                        <ArrowRightLeft className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                            {v.voucherNumber || v.voucherNo || `DRAFT-${v.id.slice(0, 4)}`}
                                                        </span>
                                                        {v.referenceNo && (
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {v.referenceNo}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="truncate text-slate-600 dark:text-slate-400 font-medium max-w-[300px]">
                                                    {v.memo || "No description provided"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <span className="font-black text-slate-900 dark:text-white tabular-nums text-base">
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
                    <div className="flex flex-col items-center justify-center py-32 px-6 text-center space-y-4">
                        <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-4 border-dotted border-slate-200 dark:border-slate-800">
                            <ArrowRightLeft className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">No Journals</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Adjust your filters or create your first journal entry to start tracking transactions.</p>
                        </div>
                        <Button onClick={() => router.push("/journals/create")} className="bg-indigo-600 rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20">
                            New Journal
                        </Button>
                    </div>
                )}
            </div>

            {vouchers.length > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    <p>Audit Log: {vouchers.length} entries found</p>
                    <div className="flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3" />
                        <span>Click any entry to view detailed audit trail</span>
                    </div>
                </div>
            )}
        </div>
    );
}
