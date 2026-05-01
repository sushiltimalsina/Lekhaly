"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { listInvoices } from "@/lib/api/invoices";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { Plus, Search, Filter, ArrowUpRight, FileText, Download, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function SalesListPage() {
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [q, setQ] = React.useState("");
    const { dateFormat } = useDateFormat();

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listInvoices({ take: 100 });
            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            // Filter for sales type if not already filtered by API
            setData(list.filter((item: any) => item.type === "sales"));
        } catch (e: any) {
            setError(e?.message ?? "Failed to load sales invoices");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        load();
    }, []);

    const filtered = data.filter((item) => {
        if (!q.trim()) return true;
        const search = q.toLowerCase();
        return (
            (item.partyName || item.party?.name || "").toLowerCase().includes(search) ||
            (item.invoiceNo || "").toLowerCase().includes(search) ||
            (item.id || "").toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-xl shadow-slate-200/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20">
                <PageHeader
                    title="Sales Invoices"
                    description="Manage your sales, collections and customer billing."
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-full shadow-sm">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                            <Link href="/sales/create">
                                <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg transition-all px-6 h-11">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Invoice
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <div className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search customer or invoice #..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="pl-9 rounded-xl bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-800"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button variant="outline" className="rounded-xl grow sm:grow-0 border-slate-100 dark:border-slate-800">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Customer / Date</th>
                                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Invoice No.</th>
                                    <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Amount</th>
                                    <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-6 py-8">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="max-w-[200px] mx-auto opacity-10 mb-4">
                                                <FileText className="h-16 w-16 mx-auto" />
                                            </div>
                                            <p className="text-muted-foreground font-medium">No sales invoices found.</p>
                                            <Link href="/sales/create">
                                                <Button variant="link" className="mt-2 text-indigo-600">Create your first invoice</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((item) => {
                                        const dateInfo = getDateDisplay({ ad: item.date, bs: item.dateBs, format: dateFormat });
                                        return (
                                            <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-foreground">{item.partyName || item.party?.name || "Unknown Customer"}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{dateInfo.primary}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                                                        {item.invoiceNo || "Draft"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={item.status as DocStatus} />
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-foreground">
                                                    <MoneyText value={Number(item.total || 0)} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/sales/${item.id}`}>
                                                            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                                                View
                                                                <ArrowUpRight className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
