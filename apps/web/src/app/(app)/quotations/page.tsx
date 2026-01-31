"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { listQuotations, type QuotationRecord } from "@/lib/api/quotations";
import StatusBadge from "@/components/app/status-badge";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { Plus, ChevronRight, FileText, Download, FileSignature } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

export default function QuotationsListPage() {
    const router = useRouter();
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<QuotationRecord[]>([]);
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
            const res = await listQuotations({
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : (filters.status as any),
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: 100,
            });
            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            setData(list);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load quotations");
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
            label: "Quotation Status",
            options: [
                { value: "draft", label: "Draft" },
                { value: "sent", label: "Sent" },
                { value: "accepted", label: "Accepted" },
                { value: "declined", label: "Declined" },
                { value: "expired", label: "Expired" },
            ],
        },
    ];

    const handleFilterChange = (newFilters: any) => {
        setFilters((prev) => ({
            ...prev,
            status: newFilters.status?.[0] || prev.status,
            from: newFilters.dateRange?.from || null,
            to: newFilters.dateRange?.to || null,
        }));
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quotations"
                description="Manage customer estimates and tracking business proposals."
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-2xl border-2 h-11 px-6 font-black text-[10px] uppercase tracking-widest hidden sm:flex">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button
                            onClick={() => router.push("/quotations/create")}
                            className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none h-11 px-8 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Quote
                        </Button>
                    </div>
                }
            />

            <AdvancedFilterBar
                onSearch={(q) => setFilters((prev) => ({ ...prev, q }))}
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
                        <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Loading Estimates...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Estimate Details</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Customer</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Valid Until</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Total Amount</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {data.map((quote) => {
                                    const quoteDateInfo = getDateDisplay({ ad: quote.quotationDate, bs: quote.quotationDateBs, format: dateFormat });
                                    const expiryDateInfo = quote.expiryDate ? getDateDisplay({ ad: quote.expiryDate, bs: quote.expiryDateBs, format: dateFormat }) : null;

                                    return (
                                        <tr
                                            key={quote.id}
                                            onClick={() => router.push(`/quotations/${quote.id}`)}
                                            className="group cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-800/50">
                                                        <FileSignature className="h-4 w-4 text-indigo-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-widest">
                                                            {quote.quotationNo || "QT-" + quote.id.slice(0, 6)}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{quoteDateInfo.primary}</span>
                                                            <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                                                            <span className="text-[9px] text-slate-400 font-medium">{quoteDateInfo.secondary}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{quote.partyName || "Unknown Customer"}</span>
                                                    {quote.memo && (
                                                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[200px]">{quote.memo}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {expiryDateInfo ? (
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-sm font-medium", quote.status === 'expired' ? "text-red-500" : "text-slate-700 dark:text-slate-300")}>
                                                            {expiryDateInfo.primary}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">{expiryDateInfo.secondary}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right whitespace-nowrap">
                                                <span className="font-black text-slate-900 dark:text-white text-base tabular-nums">
                                                    <MoneyText value={Number(quote.total || 0)} />
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <StatusBadge status={quote.status as any} />
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
                            <FileSignature className="h-10 w-10 text-slate-200" />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">No Quotations Found</h3>
                            <p className="text-sm text-slate-500 font-medium">Create your first professional estimate to win more business.</p>
                        </div>
                        <Button
                            onClick={() => setFilters({ q: "", status: "all", from: null, to: null })}
                            variant="outline"
                            className="rounded-2xl h-10 px-8 font-black text-xs uppercase tracking-widest border-2"
                        >
                            Reset Filters
                        </Button>
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    <p>Proposal Registry: {data.length} quotations active</p>
                    <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span>Proposal Tracker Active</span>
                    </div>
                </div>
            )}
        </div>
    );
}
