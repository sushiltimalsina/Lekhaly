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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileDown, RefreshCw, AlertCircle, TrendingUp, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

export default function SalesRegisterPage() {
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
                type: "sales_invoice",
                take: 1000,
            });

            const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
            setRows(data as VoucherRecord[]);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load sales register");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, searchQuery]);

    const totalSales = rows.reduce((acc, r) => acc + (r.amount ?? 0), 0);
    const totalInvoices = rows.length;

    const columns: Column<VoucherRecord>[] = [
        {
            key: "voucherDate",
            header: "Date",
            width: 150,
            cell: (r) => <DateDisplay ad={r.voucherDate} bs={r.voucherDateBs} />,
        },
        {
            key: "voucherNo",
            header: "Invoice No",
            width: 140,
            cell: (r) => <span className="mono-numbers font-bold text-slate-800 dark:text-slate-200">{r.voucherNo}</span>
        },
        {
            key: "memo",
            header: "Customer / Detail",
            cell: (r) => <div className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-sm">{r.memo ?? "—"}</div>
        },
        {
            key: "status",
            header: "Status",
            width: 120,
            cell: (r) => <StatusBadge status={r.status as DocStatus} />,
        },
        {
            key: "amount",
            header: <span className="w-full block text-right font-black">Gross Amount</span>,
            align: "right",
            width: 160,
            cell: (r) => (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                    <MoneyText value={Number(r.amount ?? 0)} className="font-bold text-blue-700 dark:text-blue-400" />
                </div>
            )
        }
    ];

    const handleFilterChange = (filters: any) => {
        if (filters.dateRange) {
            setFrom(filters.dateRange.from || null);
            setTo(filters.dateRange.to || null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                <PageHeader
                    title="Sales Register"
                    description="Consolidated list of all sales invoices issued within the selected period."
                />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={run} disabled={loading} className="rounded-xl h-10 border-border/50">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl h-10 border-border/50">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button size="sm" className="rounded-xl h-10 shadow-lg shadow-blue-500/10 bg-blue-600 hover:bg-blue-700 text-white border-none">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <AdvancedFilterBar
                className="print:hidden"
                onSearch={setSearchQuery}
                onFilterChange={handleFilterChange}
                defaultRange="this_year"
            />

            {error ? (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
                <Card className="border-border/50 bg-blue-600/5 shadow-none overflow-hidden text-foreground">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" /> Total Gross Sales
                        </div>
                        <div className="mt-2 text-2xl font-black tracking-tight flex items-baseline gap-2">
                            <MoneyText value={totalSales} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-slate-500/5 shadow-none overflow-hidden text-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                            <Tags className="h-3 w-3" /> Invoice Count
                        </div>
                        <div className="mt-2 text-2xl font-black tracking-tight">{totalInvoices}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 glass-card overflow-hidden shadow-xl shadow-foreground/5 min-h-[400px]">
                <div className="hidden print:flex flex-col items-center p-8 border-b border-border/50 text-foreground">
                    <h1 className="text-2xl font-black">Lekhaly</h1>
                    <h2 className="text-lg font-bold mt-1 uppercase tracking-widest">Sales Register</h2>
                    <div className="mt-2 text-sm text-muted-foreground uppercase tracking-widest font-medium">
                        Period: {from?.toLocaleDateString()} - {to?.toLocaleDateString()}
                    </div>
                </div>
                <DataTable
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    emptyText="No sales recorded for this period"
                    className="border-none"
                />
                {rows.length > 0 && (
                    <div className="flex items-center justify-end gap-x-12 border-t border-border/50 bg-blue-50/20 px-6 py-6">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Sales Revenue</div>
                            <MoneyText value={totalSales} className="text-2xl font-black text-foreground" />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
