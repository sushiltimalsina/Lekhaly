"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    ChevronRight,
    ChevronDown,
    RotateCw,
    FileText,
    History
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listVouchers } from "@/lib/api/vouchers";
import { getSettings, subscribeSettings } from "@/lib/store/settings";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@lekhaly/ui";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

export default function PurchaseReturnListPage() {
    const router = useRouter();
    const [settings, setSettings] = React.useState(getSettings());

    React.useEffect(() => {
        const unsubscribe = subscribeSettings((next) => setSettings(next));
        return () => { unsubscribe(); };
    }, []);

    const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<any[]>([]);
    const [filters, setFilters] = React.useState({
        q: "",
        status: "all",
        from: null as Date | null,
        to: null as Date | null,
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
        "sno", "date", "returnNo", "vendor", "amount", "status", "postedAt"
    ]);

    const columnOptions = [
        { key: "sno", label: "S.No", defaultVisible: true },
        { key: "date", label: "Return Date", defaultVisible: true },
        { key: "returnNo", label: "Return No", defaultVisible: true },
        { key: "vendor", label: "Vendor / Supplier", defaultVisible: true },
        { key: "amount", label: "Return Value", defaultVisible: true },
        { key: "memo", label: "Short Notes", defaultVisible: false },
        { key: "status", label: "Status", defaultVisible: true },
        { key: "postedAt", label: "Posted Date/Time", defaultVisible: true },
    ];

    /* Summary Metrics */
    const metrics = React.useMemo(() => {
        let totalReturn = 0;
        data.forEach(item => {
            const lines = item.lines || [];
            const amt = lines.reduce((max: number, l: any) => Math.max(max, Number(l.debit || 0)), 0);
            totalReturn += amt;
        });
        const draftsCount = data.filter(q => q.status === "draft").length;
        return { totalReturn, draftsCount };
    }, [data]);

    async function load() {
        setLoading(true);
        try {
            const res = await listVouchers({
                type: "purchase_return",
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : (filters.status as any),
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: pageSize,
                skip: (page - 1) * pageSize,
            });

            if (res && res.data && res.meta) {
                setData(res.data);
                setTotalRecords(res.meta.total);
                setTotalPages(res.meta.lastPage);
            } else {
                const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
                setData(list);
                setTotalRecords(list.length);
                setTotalPages(1);
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to load purchase returns");
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
            label: "Return Status",
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
                    title="Purchase Returns"
                    description="Monitor vendor returns and debit notes accurately."
                    actions={
                        <Button
                            onClick={() => router.push("/purchase-return/create")}
                            className="rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 px-8 h-11 transition-all active:scale-95 border-none"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Return
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Total Registry:</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg shadow-sm">{totalRecords}</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Return Value</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white mt-1"><MoneyText value={metrics.totalReturn} /></span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                        <RotateCw className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pending Drafts</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white mt-1">{metrics.draftsCount}</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                        <FileText className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white p-5 rounded-2xl shadow-lg shadow-orange-500/20 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-orange-200">Return Ledger</span>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-sm">Vendor Sync Active</span>
                    </div>
                </div>
            </div>

            <AdvancedFilterBar
                onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
                onFilterChange={handleFilterChange}
                filterOptions={filterOptions}
                columnOptions={columnOptions}
                onVisibleColumnsChange={setVisibleColumns}
                className="border-orange-100 dark:border-orange-900/50"
            />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-orange-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Processing returns...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    {visibleColumns.includes("sno") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>S.No</th>}
                                    {visibleColumns.includes("date") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Date ({calendarFmt.toUpperCase()})</th>}
                                    {visibleColumns.includes("returnNo") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Return No</th>}
                                    {visibleColumns.includes("vendor") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Vendor / Supplier</th>}
                                    {visibleColumns.includes("amount") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right", compactMode ? "py-3" : "py-4")}>Amount</th>}
                                    {visibleColumns.includes("memo") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Memo</th>}
                                    {visibleColumns.includes("status") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center", compactMode ? "py-3" : "py-4")}>Status</th>}
                                    {visibleColumns.includes("postedAt") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Posted Date/Time</th>}
                                    <th className={cn("px-6 w-10", compactMode ? "py-3" : "py-4")}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {data.map((item, index) => {
                                    const dateInfo = getDateDisplay({ ad: item.voucherDate, bs: item.voucherDateBs, format: calendarFmt });
                                    const sNo = (page - 1) * pageSize + index + 1;
                                    const lines = item.lines || [];
                                    const itemLines = lines.filter((l: any) => l.itemId);

                                    // Calculate Total Amount (Debit for Vendor in Return)
                                    const totalAmount = lines.reduce((max: number, l: any) => Math.max(max, Number(l.debit || 0)), 0);

                                    const py = compactMode ? "py-2.5" : "py-5";
                                    const isExpanded = expandedRow === item.id;

                                    return (
                                        <React.Fragment key={item.id}>
                                            <tr className="group hover:bg-orange-50/20 dark:hover:bg-orange-900/10 transition-colors">
                                                {visibleColumns.includes("sno") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap font-bold text-slate-500`}>
                                                        {sNo}
                                                    </td>
                                                )}
                                                {visibleColumns.includes("date") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap`}>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                                                {dateInfo.primary}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-medium tracking-tight">
                                                                {dateInfo.secondary}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("returnNo") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap`}>
                                                        <span
                                                            onClick={() => router.push(`/purchase-return/create?id=${item.id}`)}
                                                            className="font-black text-slate-900 dark:text-white hover:text-orange-600 transition-colors cursor-pointer"
                                                        >
                                                            {item.voucherNumber || `DRAFT-${item.id.slice(0, 4)}`}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("vendor") && (
                                                    <td
                                                        className={`px-6 ${py} cursor-pointer`}
                                                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                                                    >
                                                        <div className="flex flex-col max-w-[250px]">
                                                            <span className="truncate font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
                                                                {item.party?.name || "Unknown Vendor"}
                                                            </span>
                                                            {itemLines.length > 0 && (
                                                                <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                                    {itemLines.length} item{itemLines.length > 1 ? 's' : ''} returned
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("amount") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap text-right`}>
                                                        <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                                                            <MoneyText value={totalAmount} />
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("memo") && (
                                                    <td className={`px-6 ${py}`}>
                                                        <p className="truncate text-slate-500 dark:text-slate-400 font-medium text-xs max-w-[150px]">
                                                            {item.memo || "—"}
                                                        </p>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("status") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap text-center`}>
                                                        <StatusBadge status={item.status as DocStatus} />
                                                    </td>
                                                )}
                                                {visibleColumns.includes("postedAt") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap`}>
                                                        {item.postedAt ? (() => {
                                                            const postedInfo = getDateDisplay({ ad: item.postedAt, format: calendarFmt });
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-800 dark:text-slate-100 text-xs text-orange-600 dark:text-orange-400 uppercase tracking-tighter">
                                                                        {postedInfo.primary}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-black tracking-widest">
                                                                        {new Date(item.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })() : (
                                                            <span className="text-slate-300 font-black">—</span>
                                                        )}
                                                    </td>
                                                )}
                                                <td className={`px-6 ${py} text-right`}>
                                                    <div className="text-slate-300 group-hover:text-orange-400 transition-all">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && itemLines.length > 0 && (
                                                <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                                                    <td colSpan={visibleColumns.length + 1} className="px-6 py-4">
                                                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Itemized Return Breakdown</h4>
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                                                        <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Item Name</th>
                                                                        <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Qty</th>
                                                                        <th className="text-right py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Rate</th>
                                                                        <th className="text-right py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Taxable</th>
                                                                        <th className="text-right py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Total Cost</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                                    {itemLines.map((it: any, idx: number) => (
                                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                            <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                                                                                {it.item?.name || it.description}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-center font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                                                                                {it.qty}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                                                                                <MoneyText value={Number(it.credit || it.debit || 0) / (it.qty || 1)} />
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right text-slate-500 font-medium tabular-nums">
                                                                                <MoneyText value={it.credit || it.debit} />
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                                                                                <MoneyText value={Number(it.credit || it.debit || 0) + Number(it.taxAmount || 0)} />
                                                                            </td>
                                                                        </tr>
                                                                    ))}
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
                            <History className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm text-orange-600">No Purchase Returns Found</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Recorded vendor returns and debit notes will appear in this registry.</p>
                        </div>
                        <Button
                            onClick={() => setFilters({ q: "", status: "all", from: null, to: null })}
                            className="bg-orange-600 rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20"
                        >
                            Reset Audit Filters
                        </Button>
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Page Size:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1 outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                            registry {page} / {totalPages}
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
