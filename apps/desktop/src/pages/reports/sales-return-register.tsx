"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import DateDisplay from "@/components/app/date-display";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { listVouchers, VoucherRecord } from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Printer, RefreshCw, AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

export default function SalesReturnRegisterPage() {
    const { dateFormat } = useDateFormat();
    const initialRange = getDateRange("this_year");
    const [from, setFrom] = React.useState<Date | null>(initialRange.from);
    const [to, setTo] = React.useState<Date | null>(initialRange.to);
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<VoucherRecord[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    async function run() {
        setLoading(true);
        setError(null);
        try {
            const res = await listVouchers({
                from: from?.toISOString(),
                to: to?.toISOString(),
                q: searchQuery || undefined,
                type: "sales_return",
                take: 1000,
            });

            const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
            setRows(data as VoucherRecord[]);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load sales return register");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, searchQuery]);

    const totalReturn = rows.reduce((acc, r) => acc + (r.amount ?? 0), 0);

    const columns: Column<VoucherRecord>[] = [
        {
            key: "voucherDate",
            header: "Date",
            width: 150,
            cell: (r) => <DateDisplay ad={r.voucherDate} bs={r.voucherDateBs} />,
        },
        { key: "voucherNo", header: "CN No", width: 140, cell: (r) => <span className="mono-numbers font-bold">{r.voucherNo}</span> },
        { key: "memo", header: "Customer / Detail", cell: (r) => <div className="text-sm truncate max-w-sm">{r.memo ?? "â€”"}</div> },
        { key: "status", header: "Status", width: 120, cell: (r) => <StatusBadge status={r.status as DocStatus} /> },
        {
            key: "amount",
            header: <span className="w-full block text-right">Return Amount</span>,
            align: "right",
            width: 160,
            cell: (r) => <MoneyText value={Number(r.amount ?? 0)} className="font-bold text-orange-600 dark:text-orange-400" />
        }
    ];

    return (
        <div className="space-y-6 pb-20 text-foreground">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                <PageHeader title="Sales Return Register" description="Log of all customer returns and credit notes." />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={run} disabled={loading} className="rounded-xl h-10 border-border/50">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl h-10 border-border/50">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>
            </div>

            <AdvancedFilterBar className="print:hidden" onSearch={setSearchQuery} onFilterChange={(f) => {
                if (f.dateRange) { setFrom(f.dateRange.from); setTo(f.dateRange.to); }
            }} defaultRange="this_year" />

            {error ? <div className="p-4 rounded-xl bg-destructive/5 text-destructive text-sm border border-destructive/20">{error}</div> : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
                <Card className="border-border/50 bg-orange-600/5 shadow-none overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-orange-600 flex items-center gap-2">
                            <RotateCcw className="h-3 w-3" /> Total Sales Return
                        </div>
                        <div className="mt-2 text-2xl font-black"><MoneyText value={totalReturn} /></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 glass-card overflow-hidden shadow-xl min-h-[400px]">
                <DataTable rows={rows} columns={columns} loading={loading} emptyText="No sales returns found" className="border-none" />
                {rows.length > 0 && (
                    <div className="flex items-center justify-end border-t border-border/50 bg-orange-50/20 px-6 py-6 font-black">
                        Total: <MoneyText value={totalReturn} className="ml-4 text-xl" />
                    </div>
                )}
            </Card>
        </div>
    );
}

