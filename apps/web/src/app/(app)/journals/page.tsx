"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    ChevronRight,
    ChevronDown,
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
        amountRange: null as string | null,
        entryCount: null as string | null,
    });
    const [error, setError] = React.useState<string | null>(null);
    const [expandedRow, setExpandedRow] = React.useState<string | null>(null);

    /* Pagination State */
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(50);
    const [totalRecords, setTotalRecords] = React.useState(0);

    /* Density State */
    const [compactMode, setCompactMode] = React.useState(false);

    /* Column Visibility State */
    const [visibleColumns, setVisibleColumns] = React.useState<string[]>([
        "sno", "date", "voucherNo", "particulars", "debit", "credit", "status"
    ]);

    const columnOptions = [
        { key: "sno", label: "S.No", defaultVisible: true },
        { key: "date", label: "Date", defaultVisible: true },
        { key: "voucherNo", label: "Voucher No", defaultVisible: true },
        { key: "particulars", label: "Particulars", defaultVisible: true },
        { key: "debit", label: "Debit Amount", defaultVisible: true },
        { key: "credit", label: "Credit Amount", defaultVisible: true },
        { key: "status", label: "Status", defaultVisible: true },
    ];

    /* Client-side filtering for amount and entry count */
    const filteredVouchers = React.useMemo(() => {
        let filtered = [...vouchers];

        // Apply amount range filter
        if (filters.amountRange) {
            const [min, max] = filters.amountRange.split('-').map(Number);
            filtered = filtered.filter(v => {
                const totalDebit = v.lines?.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0) || 0;
                return totalDebit >= min && totalDebit <= max;
            });
        }

        // Apply entry count filter
        if (filters.entryCount) {
            filtered = filtered.filter(v => {
                const count = v.lines?.length || 0;
                if (filters.entryCount === '2') return count === 2;
                if (filters.entryCount === '3-5') return count >= 3 && count <= 5;
                if (filters.entryCount === '6-10') return count >= 6 && count <= 10;
                if (filters.entryCount === '10+') return count > 10;
                return true;
            });
        }

        return filtered;
    }, [vouchers, filters.amountRange, filters.entryCount]);

    /* Summary Metrics */
    const metrics = React.useMemo(() => {
        const totalAmount = filteredVouchers.reduce((acc, v) => acc + (v.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0), 0);
        const draftCount = filteredVouchers.filter(v => v.status === "draft").length;
        return { totalAmount, draftCount };
    }, [filteredVouchers]);

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

    const filterOptions = [
        {
            key: "status",
            label: "Journal Status",
            options: [
                { value: "draft", label: "Draft" },
                { value: "posted", label: "Posted" },
                { value: "void", label: "Void" },
            ]
        },
        {
            key: "amountRange",
            label: "Amount Range",
            options: [
                { value: "0-1000", label: "Under ₹1,000" },
                { value: "1000-5000", label: "₹1,000 - ₹5,000" },
                { value: "5000-10000", label: "₹5,000 - ₹10,000" },
                { value: "10000-50000", label: "₹10,000 - ₹50,000" },
                { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
                { value: "100000-999999999", label: "Above ₹1,00,000" },
            ]
        },
        {
            key: "entryCount",
            label: "Entry Count",
            options: [
                { value: "2", label: "2 Entries" },
                { value: "3-5", label: "3-5 Entries" },
                { value: "6-10", label: "6-10 Entries" },
                { value: "10+", label: "More than 10" },
            ]
        }
    ];

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({
            ...prev,
            status: newFilters.status?.[0] || prev.status,
            from: newFilters.dateRange?.from || null,
            to: newFilters.dateRange?.to || null,
            amountRange: newFilters.amountRange?.[0] || null,
            entryCount: newFilters.entryCount?.[0] || null,
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
                columnOptions={columnOptions}
                onVisibleColumnsChange={setVisibleColumns}
                className="border-indigo-100 dark:border-indigo-800/50"
            />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {loading && filteredVouchers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-900/30"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest text-[10px] font-black">Syncing Ledger...</p>
                    </div>
                ) : filteredVouchers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>S.No</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Date</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Voucher No</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Particulars</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right", compactMode ? "py-3" : "py-4")}>Debit</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right", compactMode ? "py-3" : "py-4")}>Credit</th>
                                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center", compactMode ? "py-3" : "py-4")}>Status</th>
                                    <th className={cn("px-6 w-10", compactMode ? "py-3" : "py-4")}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {filteredVouchers.map((v, index) => {
                                    const dateInfo = getDateDisplay({ ad: v.voucherDate, bs: v.voucherDateBs, format: dateFormat });
                                    const sNo = (page - 1) * pageSize + index + 1;
                                    const totalDebit = v.lines?.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0) || 0;
                                    const totalCredit = v.lines?.reduce((sum: number, line: any) => sum + Number(line.credit || 0), 0) || 0;

                                    // Extract ledger account names from journal lines
                                    const ledgerAccounts = Array.from(new Set(
                                        v.lines?.map((l: any) => {
                                            // Prioritize account name, fallback to party name
                                            return l.account?.name || l.party?.name || null;
                                        }).filter(Boolean)
                                    ));

                                    const firstAccount = ledgerAccounts[0] || v.voucherNumber || v.voucherNo || `JV-${v.id.slice(0, 6)}`;
                                    const totalEntries = v.lines?.length || 0;

                                    const py = compactMode ? "py-2.5" : "py-5";
                                    const isExpanded = expandedRow === v.id;

                                    return (
                                        <React.Fragment key={v.id}>
                                            <tr className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                                                <td className={`px-6 ${py} whitespace-nowrap font-bold text-slate-500`}>
                                                    {sNo}
                                                </td>
                                                <td className={`px-6 ${py} whitespace-nowrap`}>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">{dateInfo.primary}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{dateInfo.secondary}</span>
                                                    </div>
                                                </td>
                                                <td className={`px-6 ${py} whitespace-nowrap`}>
                                                    <span
                                                        onClick={() => router.push(`/journals/create?id=${v.id}`)}
                                                        className="font-black text-slate-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer"
                                                    >
                                                        {v.voucherNumber || v.voucherNo || `DRAFT-${v.id.slice(0, 4)}`}
                                                    </span>
                                                </td>
                                                <td
                                                    className={`px-6 ${py} cursor-pointer`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedRow(isExpanded ? null : v.id);
                                                    }}
                                                >
                                                    <div className="flex flex-col max-w-[250px]">
                                                        <span className="truncate font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors" title={firstAccount}>
                                                            {firstAccount}
                                                        </span>
                                                        {totalEntries > 0 && (
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                +{totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={`px-6 ${py} whitespace-nowrap text-right`}>
                                                    <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                                                        <MoneyText value={totalDebit} />
                                                    </span>
                                                </td>
                                                <td className={`px-6 ${py} whitespace-nowrap text-right`}>
                                                    <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                                                        <MoneyText value={totalCredit} />
                                                    </span>
                                                </td>
                                                <td className={`px-6 ${py} whitespace-nowrap text-center`}>
                                                    <StatusBadge status={v.status as DocStatus} />
                                                </td>
                                                <td className={`px-6 ${py} text-right`}>
                                                    <div className="text-slate-300 group-hover:text-indigo-400 transition-all">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && v.lines && v.lines.length > 0 && (
                                                <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                                                    <td colSpan={8} className="px-6 py-4">
                                                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Journal Entries</h4>
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                                                        <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Type</th>
                                                                        <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Account/Party</th>
                                                                        <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Description</th>
                                                                        <th className="text-right py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Debit</th>
                                                                        <th className="text-right py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Credit</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                                    {v.lines.map((line: any, idx: number) => {
                                                                        const debitAmount = Number(line.debit || 0);
                                                                        const creditAmount = Number(line.credit || 0);

                                                                        return (
                                                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                                <td className="py-2 px-3">
                                                                                    <span className={cn(
                                                                                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                                                                        debitAmount > 0
                                                                                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                                                                                            : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                                                                                    )}>
                                                                                        {debitAmount > 0 ? "DR" : "CR"}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                                                                                    {line.account?.name || line.party?.name || "-"}
                                                                                </td>
                                                                                <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                                                                                    {line.description || "-"}
                                                                                </td>
                                                                                <td className="py-2 px-3 text-right font-bold tabular-nums">
                                                                                    {debitAmount > 0 ? <MoneyText value={debitAmount} /> : "-"}
                                                                                </td>
                                                                                <td className="py-2 px-3 text-right font-bold tabular-nums">
                                                                                    {creditAmount > 0 ? <MoneyText value={creditAmount} /> : "-"}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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
                            onClick={() => setFilters({ q: "", status: "all", from: null, to: null, amountRange: null, entryCount: null })}
                            className="bg-indigo-600 rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                        >
                            Reset Audit Filters
                        </Button>
                    </div>
                )}
            </div>

            {filteredVouchers.length > 0 && (
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
