"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getProfitLoss } from "@/lib/api/reports";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Progress } from "@lekhaly/ui";
import { RefreshCw, AlertCircle, PieChart, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

type ExpenseRow = {
    id: string;
    name: string;
    amount: number;
    percentage?: number;
};

export default function ExpensesDetailsPage() {
    const initialRange = getDateRange("this_year");
    const [from, setFrom] = React.useState<Date | null>(initialRange.from);
    const [to, setTo] = React.useState<Date | null>(initialRange.to);
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<ExpenseRow[]>([]);
    const [totalExpenses, setTotalExpenses] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);

    async function run() {
        setLoading(true);
        setError(null);
        try {
            const res = await getProfitLoss({
                from: from?.toISOString(),
                to: to?.toISOString()
            });

            // Extract expenses from P&L response
            // Structure: { operatingExpenses: { accounts: [...] }, costOfSales: { accounts: [...] } }
            const opExp = res?.operatingExpenses?.accounts || [];
            const cogs = res?.costOfSales?.accounts || [];
            const combined = [...opExp, ...cogs].map((a: any) => ({
                id: a.id,
                name: a.name,
                amount: Math.abs(a.balance ?? a.amount ?? 0)
            })).sort((a, b) => b.amount - a.amount);

            const total = combined.reduce((acc, r) => acc + r.amount, 0);
            setTotalExpenses(total);

            setRows(combined.map(r => ({
                ...r,
                percentage: total > 0 ? (r.amount / total) * 100 : 0
            })));
        } catch (e: any) {
            setError(e?.message ?? "Failed to load expense details");
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => { run(); }, [from, to]);

    const columns: Column<ExpenseRow>[] = [
        { key: "name", header: "Expense Category", cell: r => <span className="font-bold text-slate-800 dark:text-slate-200">{r.name}</span> },
        {
            key: "allocation", header: "Allocation", width: 250, cell: r => (
                <div className="space-y-1.5 pt-1">
                    <Progress value={r.percentage} className="h-2" />
                    <div className="text-[10px] text-muted-foreground font-medium">{r.percentage?.toFixed(1)}% of total</div>
                </div>
            )
        },
        { key: "amount", header: <span className="w-full block text-right font-black">Amount</span>, align: "right", width: 160, cell: r => <MoneyText value={r.amount} className="font-black" /> }
    ];

    return (
        <div className="space-y-6 pb-20 text-foreground">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <PageHeader title="Expenses Details" description="Granular breakdown of operational costs and COGS." />
                <Button variant="outline" className="rounded-xl h-10 border-border/50" onClick={run}><RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh</Button>
            </div>

            <AdvancedFilterBar onFilterChange={f => { if (f.dateRange) { setFrom(f.dateRange.from); setTo(f.dateRange.to); } }} defaultRange="this_year" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border/50 bg-red-600/5 shadow-none overflow-hidden text-foreground">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-red-600 flex items-center gap-2">
                            <PieChart className="h-3 w-3" /> Combined Expenditure
                        </div>
                        <div className="mt-2 text-2xl font-black"><MoneyText value={totalExpenses} /></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 glass-card overflow-hidden shadow-xl min-h-[400px]">
                <DataTable rows={rows} columns={columns} loading={loading} emptyText="No expense records found" className="border-none" />
            </Card>
        </div>
    );
}
