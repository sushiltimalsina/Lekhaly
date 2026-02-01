"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { listInvoices } from "@/lib/api/invoices";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { Plus, ChevronRight, FileText, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

export default function SalesListPage() {
    const router = useRouter();
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const [filters, setFilters] = React.useState({
        q: "",
        status: "all",
        from: null as Date | null,
        to: null as Date | null,
    });

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listInvoices({
                type: "sales",
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : filters.status,
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: 100
            });
            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            setData(list);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load sales invoices");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const filterOptions = [
        {
            key: "status",
            label: "Invoice Status",
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
        <div className="space-y-6">
            <PageHeader
                title="Sales Invoices"
                description="Manage your sales, collections and customer billing."
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-2xl border-2 h-11 px-6 font-black text-[10px] uppercase tracking-widest hidden sm:flex">
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                        <Button
                            onClick={() => router.push("/sales/create")}
                            className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 h-11 px-8 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Invoice
                        </Button>
                    </div>
                }
            />

            <AdvancedFilterBar
                onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
                onFilterChange={handleFilterChange}
                filterOptions={filterOptions}
            />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Processing Records...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                        <table className="w-full text-sm text-left min-w-[1400px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Invoice No</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Ref No</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Customer Name</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">PAN/VAT</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Item Details</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Qty</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Rate</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Taxable</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Non-Taxable</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Notes</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {data.map((item) => {
                                    const dateInfo = getDateDisplay({ ad: item.date, bs: item.dateBs, format: dateFormat });
                                    const items = item.items || [];
                                    const firstItem = items[0];
                                    const itemSummary = items.length > 1
                                        ? `${firstItem?.item?.name || firstItem?.description || "Mixed"} (+${items.length - 1})`
                                        : (firstItem?.item?.name || firstItem?.description || "—");

                                    const totalQty = items.reduce((sum: number, i: any) => sum + Number(i.qty || 0), 0);
                                    const avgRate = items.length === 1 ? Number(firstItem?.rate || 0) : null;

                                    let taxableAmount = 0;
                                    let nonTaxableAmount = 0;

                                    items.forEach((i: any) => {
                                        const lineVal = Number(i.amount || 0);
                                        const hasTax = Number(i.taxAmount || 0) > 0 || !!i.taxCodeId;
                                        if (hasTax) {
                                            taxableAmount += lineVal;
                                        } else {
                                            nonTaxableAmount += lineVal;
                                        }
                                    });

                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => router.push(`/vouchers/${item.voucherId || item.id}`)}
                                            className="group cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{dateInfo.primary}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium">{dateInfo.secondary}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">
                                                {item.invoiceNo || "DRAFT"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">{item.referenceNo || item.voucher?.referenceNo || "—"}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{item.partyName || item.party?.name || "Unknown Customer"}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                                                {item.party?.panNumber || item.party?.vatNumber || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[200px] block" title={itemSummary}>
                                                    {itemSummary}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                                {totalQty.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                                                {avgRate !== null ? <MoneyText value={avgRate} /> : <span className="text-[10px] italic">Mixed</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                                                <MoneyText value={taxableAmount} />
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-400">
                                                <MoneyText value={nonTaxableAmount} />
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <span className="font-black text-indigo-600 dark:text-indigo-400 text-base tabular-nums">
                                                    <MoneyText value={Number(item.total || 0)} />
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-400 font-medium truncate max-w-[150px] block" title={item.voucher?.memo || item.memo}>
                                                    {item.voucher?.memo || item.memo || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <StatusBadge status={item.status as DocStatus} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
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
                            <FileText className="h-10 w-10 text-slate-200" />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">No Invoices Found</h3>
                            <p className="text-sm text-slate-500 font-medium">No sales records match your current audit filters. Try searching by customer name or adjusting the date range.</p>
                        </div>
                        <Button
                            onClick={() => setFilters({ q: "", status: "all", from: null, to: null })}
                            variant="outline"
                            className="rounded-2xl h-10 px-8 font-black text-xs uppercase tracking-widest border-2"
                        >
                            Reset Registry Filters
                        </Button>
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    <p>Registry Update: {data.length} invoices found</p>
                    <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span>Real-time Financial Sync</span>
                    </div>
                </div>
            )}
        </div>
    );
}
