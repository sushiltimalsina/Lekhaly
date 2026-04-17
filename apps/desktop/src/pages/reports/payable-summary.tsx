"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getPartyAging } from "@/lib/api/reports";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Progress } from "@lekhaly/ui";
import { ArrowUpRight, Phone, Mail, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type PartySummary = {
    partyId: string;
    partyName: string;
    email?: string;
    phone?: string;
    total?: number;
    current?: number;
};

export default function PayableSummaryPage() {
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<PartySummary[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    async function run() {
        setLoading(true);
        setError(null);
        try {
            const res = await getPartyAging({ type: "supplier" });
            const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? [];
            setRows(data as PartySummary[]);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load payables");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => { run(); }, []);

    const filteredRows = rows.filter(r => r.partyName.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalPayables = filteredRows.reduce((acc, r) => acc + (r.total ?? 0), 0);
    const totalOverdue = filteredRows.reduce((acc, r) => acc + (r.total ?? 0) - (r.current ?? 0), 0);

    const columns: Column<PartySummary>[] = [
        {
            key: "party", header: "Supplier", cell: (r) => (
                <Link to={`/vendors/${r.partyId}`} className="group block">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-black">
                            {r.partyName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold group-hover:text-primary transition-colors">{r.partyName}</span>
                            <div className="flex gap-3 text-[10px] text-muted-foreground">
                                {r.phone && <span className="flex items-center gap-1"><Phone className="h-2 w-2" /> {r.phone}</span>}
                            </div>
                        </div>
                    </div>
                </Link>
            )
        },
        {
            key: "aging", header: "Liability Age", width: 200, cell: (r) => {
                const overdue = (r.total ?? 0) - (r.current ?? 0);
                const percent = r.total ? (overdue / r.total) * 100 : 0;
                return (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                            <span>Overdue</span>
                            <span className="text-red-500">{Math.round(percent)}%</span>
                        </div>
                        <Progress value={percent} className="h-1.5" indicatorClassName="bg-red-500" />
                    </div>
                )
            }
        },
        {
            key: "total",
            header: <span className="w-full block text-right font-black">Total Payable</span>,
            align: "right", width: 180,
            cell: (r) => (
                <div className="flex flex-col items-end">
                    <MoneyText value={r.total ?? 0} className="font-black text-lg text-red-600 dark:text-red-400" />
                </div>
            )
        },
        {
            key: "action",
            header: "",
            width: 50,
            cell: (r) => <ChevronRight className="h-4 w-4 text-muted-foreground" />
        }
    ];

    return (
        <div className="space-y-6 pb-20 text-foreground">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <PageHeader title="Payable Summary" description="Tracking total amounts you owe to suppliers." />
                <Button variant="outline" className="rounded-xl h-10 border-border/50" onClick={run}><RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh</Button>
            </div>

            <AdvancedFilterBar onSearch={setSearchQuery} />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 bg-red-600/5 shadow-none overflow-hidden text-foreground">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-red-600 flex items-center gap-2">
                            <ArrowUpRight className="h-3 w-3" /> Total Owed (Accounts Payable)
                        </div>
                        <div className="mt-2 text-2xl font-black"><MoneyText value={totalPayables} /></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 glass-card overflow-hidden shadow-xl min-h-[400px]">
                <DataTable rows={filteredRows} columns={columns} loading={loading} emptyText="No outstanding payables found" className="border-none" rowClassName="hover:bg-red-50/50 dark:hover:bg-red-900/10 cursor-pointer" />
            </Card>
        </div>
    );
}


