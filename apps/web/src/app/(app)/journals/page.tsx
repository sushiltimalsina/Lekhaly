"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    ChevronRight,
    ArrowRightLeft,
    ArrowRight,
    Wallet,
    FileText,
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listVouchers } from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

export default function JournalsListPage() {
    const router = useRouter();
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [vouchers, setVouchers] = React.useState<any[]>([]);
    const [filters, setFilters] = React.useState({
        q: "",
        status: "all",
        from: null as Date | null,
        to: null as Date | null,
    });
    const [error, setError] = React.useState<string | null>(null);

    /* Pagination State */
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(50);
    const [totalRecords, setTotalRecords] = React.useState(0);

    /* Density State */
    const [compactMode, setCompactMode] = React.useState(false);

    /* Summary Metrics */
    const metrics = React.useMemo(() => {
        const totalAmount = vouchers.reduce((acc, v) => acc + (v.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0), 0);
        const draftCount = vouchers.filter(v => v.status === "draft").length;
        return { totalAmount, draftCount };
    }, [vouchers]);

    async function load() {
        setLoading(true);
        try {
            const res = await listVouchers({
                type: "journal",
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : (filters.status as any),
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: pageSize,
                skip: (page - 1) * pageSize,
            });

            if (res && res.data && res.meta) {
                setVouchers(res.data);
                setTotalRecords(res.meta.total);
                setTotalPages(res.meta.lastPage);
            } else {
                const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
                setVouchers(list);
                setTotalRecords(list.length);
                setTotalPages(1);
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to load journals");
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        setPage(1);
    }, [filters, pageSize]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, page, pageSize]);

    // ... existing filterOptions ...

    const filterOptions = [
        {
            key: "status",
            label: "Journal Status",
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
            status: newFilters.status?.[0] || prev.status,
            from: newFilters.dateRange?.from || null,
            to: newFilters.dateRange?.to || null,
        }));
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Journal Vouchers"
                    description="General ledger adjustments, depreciation, and internal transfers."
                    actions={
                        <Button
                            onClick={() => router.push("/journals/create")}
                            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8 h-11 transition-all active:scale-95 border-none"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Journal
                        </Button>
                    }
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant={compactMode ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setCompactMode(!compactMode)}
                        className="rounded-xl h-9 px-3 text-xs font-bold uppercase tracking-wider hidden md:flex"
                    >
                        {compactMode ? "Comfortable" : "Compact"}
                    </Button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Total Records:</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg shadow-sm">{totalRecords}</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Volume (View)</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white mt-1"><MoneyText value={metrics.totalAmount} /></span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                        <Wallet className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pending Drafts</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white mt-1">{metrics.draftCount}</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                        <FileText className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-200">System Status</span>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-sm">Ledger Synced</span>
                    </div>
                </div>
            </div>

            <AdvancedFilterBar
                onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
                onFilterChange={handleFilterChange}
                filterOptions={filterOptions}
                className="border-indigo-100 dark:border-indigo-800/50"
            />

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
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Date (AD/BS)</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Voucher Identity</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Description</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right", compactMode ? "py-3" : "py-4")}>Amount</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center", compactMode ? "py-3" : "py-4")}>Status</th>
                                    <th className={cn("px-6 w-10", compactMode ? "py-3" : "py-4")}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {vouchers.map((v) => {
                                    const dateInfo = getDateDisplay({ ad: v.voucherDate, bs: v.voucherDateBs, format: dateFormat });

                                    const totalAmount = v.lines?.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0) || 0;
                                    const py = compactMode ? "py-2.5" : "py-5";

                                    return (
                                        <tr
                                            key={v.id}
                                            onClick={() => router.push(`/journals/create?id=${v.id}`)}
                                            className="group cursor-pointer hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                                        >
                                            <td className={`px-6 ${py} whitespace-nowrap`}>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{dateInfo.primary}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{dateInfo.secondary}</span>
                                                </div>
                                            </td>
                                            <td className={`px-6 ${py} whitespace-nowrap`}>
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
                                            <td className={`px-6 ${py}`}>
                                                <p className="truncate text-slate-600 dark:text-slate-400 font-medium max-w-[300px]">
                                                    {v.memo || "No description provided"}
                                                </p>
                                            </td>
                                            <td className={`px-6 ${py} whitespace-nowrap text-right`}>
                                                <span className="font-black text-slate-900 dark:text-white tabular-nums text-base">
                                                    <MoneyText value={totalAmount} />
                                                </span>
                                            </td>
                                            <td className={`px-6 ${py} whitespace-nowrap text-center`}>
                                                <StatusBadge status={v.status as DocStatus} />
                                            </td>
                                            <td className={`px-6 ${py} text-right`}>
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
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm text-indigo-600">No Journals Found</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Adjust your filters or create your first journal entry to start tracking transactions.</p>
                        </div>
                        <Button
                            onClick={() => setFilters({ q: "", status: "all", from: null, to: null })}
                            className="bg-indigo-600 rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                        >
                            Reset Audit Filters
                        </Button>
                    </div>
                )}
            </div>

            {vouchers.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1 outline-none focus:ring-2 ring-indigo-500/50"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
