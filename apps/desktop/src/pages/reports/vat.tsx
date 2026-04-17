"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getVatReport } from "@/lib/api/taxes";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Printer, RefreshCw, AlertCircle, Percent, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

type VatRow = {
    date?: string;
    ref?: string;
    partyName?: string;
    panNo?: string;
    taxableAmount?: number;
    vatAmount?: number;
    totalAmount?: number;
    type?: "Sales" | "Purchase";
};

export default function VatReportPage() {
    const initialRange = getDateRange("this_year");
    const [from, setFrom] = React.useState<Date | null>(initialRange.from);
    const [to, setTo] = React.useState<Date | null>(initialRange.to);
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<VatRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    async function run() {
        setLoading(true);
        setError(null);
        try {
            const res = await getVatReport({
                from: from?.toISOString(),
                to: to?.toISOString(),
                q: searchQuery || undefined
            });

            const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
            setRows(data as VatRow[]);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load VAT report");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, searchQuery]);

    const totalVat = rows.reduce((acc, r) => acc + (r.vatAmount ?? 0), 0);
    const totalTaxable = rows.reduce((acc, r) => acc + (r.taxableAmount ?? 0), 0);

    const columns: Column<VatRow>[] = [
        { key: "date", header: "Date", width: 120, cell: (r) => r.date || "â€”" },
        { key: "ref", header: "Ref No", width: 120, cell: (r) => r.ref || "â€”" },
        {
            key: "party", header: "Party Name", cell: (r) => (
                <div className="flex flex-col">
                    <span className="font-bold">{r.partyName ?? "â€”"}</span>
                    {r.panNo && <span className="text-[10px] text-muted-foreground">PAN: {r.panNo}</span>}
                </div>
            )
        },
        {
            key: "type", header: "Type", width: 100, cell: (r) => (
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black uppercase", r.type === "Sales" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                    {r.type}
                </span>
            )
        },
        { key: "taxable", header: <span className="w-full block text-right">Taxable Amt</span>, align: "right", width: 140, cell: (r) => <MoneyText value={r.taxableAmount ?? 0} /> },
        { key: "vat", header: <span className="w-full block text-right font-bold text-primary">VAT (13%)</span>, align: "right", width: 140, cell: (r) => <MoneyText value={r.vatAmount ?? 0} className="font-bold text-primary" /> },
        { key: "total", header: <span className="w-full block text-right">Total</span>, align: "right", width: 140, cell: (r) => <MoneyText value={r.totalAmount ?? 0} /> },
    ];

    return (
        <div className="space-y-6 pb-20 text-foreground">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                <PageHeader title="VAT Report" description="Standard Annexure reporting for sales and purchases." />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={run} disabled={loading} className="rounded-xl h-10"><RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh</Button>
                    <Button size="sm" className="rounded-xl h-10 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/10"><FileText className="mr-2 h-4 w-4" /> Download Annexure</Button>
                </div>
            </div>

            <AdvancedFilterBar className="print:hidden" onSearch={setSearchQuery} onFilterChange={(f) => {
                if (f.dateRange) { setFrom(f.dateRange.from); setTo(f.dateRange.to); }
            }} defaultRange="this_year" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
                <Card className="border-border/50 bg-primary/5 shadow-none overflow-hidden text-foreground">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-2">
                            <Percent className="h-3 w-3" /> Total VAT Collected/Paid
                        </div>
                        <div className="mt-2 text-2xl font-black"><MoneyText value={totalVat} /></div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-slate-500/5 shadow-none overflow-hidden text-foreground">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                            Total Taxable Turnover
                        </div>
                        <div className="mt-2 text-2xl font-black"><MoneyText value={totalTaxable} /></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 glass-card overflow-hidden shadow-xl min-h-[400px]">
                <DataTable rows={rows} columns={columns} loading={loading} emptyText="No taxable transactions found" className="border-none" />
            </Card>
        </div>
    );
}

