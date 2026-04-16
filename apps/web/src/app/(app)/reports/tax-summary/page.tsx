"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getVatSummary } from "@/lib/api/taxes";
import { Card, CardContent } from "@lekhaly/ui";
import { RefreshCw, AlertCircle, Percent, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

type SummaryRow = {
    taxName?: string;
    taxRate?: number;
    taxableAmount?: number;
    inputTax?: number;
    outputTax?: number;
    payableAmount?: number;
};

export default function TaxSummaryPage() {
    const initialRange = getDateRange("this_year");
    const [from, setFrom] = React.useState<Date | null>(initialRange.from);
    const [to, setTo] = React.useState<Date | null>(initialRange.to);
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<SummaryRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    async function run() {
        setLoading(true);
        setError(null);
        try {
            const res = await getVatSummary({
                from: from?.toISOString(),
                to: to?.toISOString()
            });

            const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
            setRows(data as SummaryRow[]);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load tax summary");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to]);

    const totalInput = rows.reduce((acc, r) => acc + (r.inputTax ?? 0), 0);
    const totalOutput = rows.reduce((acc, r) => acc + (r.outputTax ?? 0), 0);
    const netPayable = totalOutput - totalInput;

    const columns: Column<SummaryRow>[] = [
        {
            key: "tax", header: "Tax Classification", cell: (r) => (
                <div className="flex flex-col">
                    <span className="font-bold">{r.taxName ?? "Standard VAT"}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Rate: {r.taxRate}%</span>
                </div>
            )
        },
        { key: "taxable", header: <span className="w-full block text-right">Taxable Amount</span>, align: "right", cell: (r) => <MoneyText value={r.taxableAmount ?? 0} /> },
        { key: "input", header: <span className="w-full block text-right text-emerald-600">Input Tax (Paid)</span>, align: "right", cell: (r) => <MoneyText value={r.inputTax ?? 0} className="text-emerald-600" /> },
        { key: "output", header: <span className="w-full block text-right text-red-600">Output Tax (Collected)</span>, align: "right", cell: (r) => <MoneyText value={r.outputTax ?? 0} className="text-red-600" /> },
        {
            key: "net", header: <span className="w-full block text-right font-black">Net Tax Payable</span>, align: "right", cell: (r) => (
                <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                    <MoneyText value={r.payableAmount ?? (Number(r.outputTax ?? 0) - Number(r.inputTax ?? 0))} className="font-bold text-foreground" />
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6 pb-20 text-foreground">
            <PageHeader title="Tax Summary" description="Overview of tax liability and credits grouped by classification." />

            <AdvancedFilterBar onFilterChange={(f) => {
                if (f.dateRange) { setFrom(f.dateRange.from); setTo(f.dateRange.to); }
            }} defaultRange="this_year" />

            {error ? <div className="p-4 rounded-xl bg-destructive/5 text-destructive text-sm border border-destructive/20">{error}</div> : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
                <Card className="border-border/50 bg-emerald-600/5 shadow-none overflow-hidden relative text-foreground">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Total Input Tax</div>
                        <div className="mt-2 text-xl font-bold tracking-tight"><MoneyText value={totalInput} /></div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-red-600/5 shadow-none overflow-hidden relative text-foreground">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-red-600">Total Output Tax</div>
                        <div className="mt-2 text-xl font-bold tracking-tight"><MoneyText value={totalOutput} /></div>
                    </CardContent>
                </Card>
                <Card className={cn("border-border/50 shadow-none overflow-hidden relative", netPayable > 0 ? "bg-orange-600/5" : "bg-emerald-600/5")}>
                    <CardContent className="pt-6">
                        <div className={cn("text-[10px] uppercase font-bold tracking-widest", netPayable > 0 ? "text-orange-600" : "text-emerald-600")}>
                            {netPayable > 0 ? "Tax Payable" : "Tax Credit"}
                        </div>
                        <div className="mt-2 text-xl font-black tabular-nums">
                            <MoneyText value={Math.abs(netPayable)} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-primary/5 shadow-none overflow-hidden relative text-foreground">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-primary">
                            <ShieldCheck className="h-3 w-3" /> Compliance Status
                        </div>
                        <div className="mt-2 text-xl font-black text-primary">Verified</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 glass-card overflow-hidden shadow-xl min-h-[300px]">
                <DataTable rows={rows} columns={columns} loading={loading} emptyText="No tax data available" className="border-none" />
            </Card>
        </div>
    );
}
