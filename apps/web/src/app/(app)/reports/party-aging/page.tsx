"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getPartyAging } from "@/lib/api/reports";
import { useDateFormat } from "@/lib/date-format";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Printer, FileDown, RefreshCw, AlertCircle, Clock, Timer, History, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

type Row = {
  partyName?: string;
  current?: number;
  days1to30?: number;
  days31to60?: number;
  days61to90?: number;
  days90plus?: number;
  total?: number;
};

export default function PartyAgingPage() {
  const { dateFormat } = useDateFormat();
  const [asOf, setAsOf] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getPartyAging({
        asOf: asOf?.toISOString() || undefined,
        q: searchQuery || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load party aging");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOf, searchQuery]);

  const totals = rows.reduce((acc, r) => ({
    current: acc.current + (r.current ?? 0),
    days1: acc.days1 + (r.days1to30 ?? 0),
    days31: acc.days31 + (r.days31to60 ?? 0),
    days61: acc.days61 + (r.days61to90 ?? 0),
    days90: acc.days90 + (r.days90plus ?? 0),
    total: acc.total + (r.total ?? 0),
  }), { current: 0, days1: 0, days31: 0, days61: 0, days90: 0, total: 0 } as Record<string, number>);

  const columns: Column<Row>[] = [
    {
      key: "party",
      header: "Party / Customer",
      cell: (r) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-foreground">{r.partyName ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "current",
      header: <span className="w-full block text-right">Current</span>,
      align: "right",
      width: 140,
      cell: (r) => <MoneyText value={Number(r.current ?? 0)} className={cn(r.current && r.current > 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground/30")} />
    },
    {
      key: "1-30",
      header: <span className="w-full block text-right">1–30 Days</span>,
      align: "right",
      width: 120,
      cell: (r) => <MoneyText value={Number(r.days1to30 ?? 0)} className={cn(r.days1to30 && r.days1to30 > 0 ? "text-blue-600 dark:text-blue-400 font-medium" : "text-muted-foreground/30")} />
    },
    {
      key: "31-60",
      header: <span className="w-full block text-right">31–60 Days</span>,
      align: "right",
      width: 120,
      cell: (r) => <MoneyText value={Number(r.days31to60 ?? 0)} className={cn(r.days31to60 && r.days31to60 > 0 ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground/30")} />
    },
    {
      key: "61-90",
      header: <span className="w-full block text-right">61–90 Days</span>,
      align: "right",
      width: 120,
      cell: (r) => <MoneyText value={Number(r.days61to90 ?? 0)} className={cn(r.days61to90 && r.days61to90 > 0 ? "text-rose-600 dark:text-rose-400 font-medium" : "text-muted-foreground/30")} />
    },
    {
      key: "90+",
      header: <span className="w-full block text-right font-black">90+ Days</span>,
      align: "right",
      width: 120,
      cell: (r) => <MoneyText value={Number(r.days90plus ?? 0)} className={cn(r.days90plus && r.days90plus > 0 ? "text-red-700 font-black" : "text-muted-foreground/30")} />
    },
    {
      key: "total",
      header: <span className="w-full block text-right font-black text-foreground underline decoration-primary/30 underline-offset-4">Total Due</span>,
      align: "right",
      width: 150,
      cell: (r) => (
        <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
          <MoneyText value={Number(r.total ?? 0)} className="font-black text-foreground" />
        </div>
      )
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleFilterChange = (filters: any) => {
    if (filters.dateRange) {
      setAsOf(filters.dateRange.to || filters.dateRange.from || null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <PageHeader
          title="Party Aging"
          description="Analyze outstanding balances across different time buckets."
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={run} disabled={loading} className="rounded-xl h-10 border-border/50">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl h-10 border-border/50">
            <Printer className="mr-2 h-4 w-4" />
            Print List
          </Button>
          <Button size="sm" className="rounded-xl h-10 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/10">
            <FileDown className="mr-2 h-4 w-4" />
            Export aging
          </Button>
        </div>
      </div>

      <AdvancedFilterBar
        className="print:hidden"
        onSearch={setSearchQuery}
        onFilterChange={handleFilterChange}
      />

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 print:hidden">
        <AgingCard title="Current" amount={totals.current} icon={Clock} color="text-emerald-500" />
        <AgingCard title="1-30 Days" amount={totals.days1} icon={Timer} color="text-blue-500" />
        <AgingCard title="31-60 Days" amount={totals.days31} icon={History} color="text-orange-500" />
        <AgingCard title="61-90 Days" amount={totals.days61} icon={CalendarClock} color="text-rose-500" />
        <AgingCard title="Over 90 Days" amount={totals.days90} icon={AlertCircle} color="text-red-500" highlight />
      </div>

      <Card className="border-border/50 glass-card overflow-hidden shadow-xl shadow-foreground/5 min-h-[400px]">
        <div className="hidden print:flex flex-col items-center p-8 border-b border-border/50 text-foreground">
          <h1 className="text-2xl font-black">Lekhaly</h1>
          <h2 className="text-lg font-bold mt-1 uppercase tracking-widest text-primary">Aged Receivables Report</h2>
          <div className="mt-2 text-sm text-muted-foreground">Snapshot As of: {asOf?.toLocaleDateString() || "Today"}</div>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          emptyText="No outstanding balances found"
          className="border-none"
        />
        {rows.length > 0 && (
          <div className="flex items-center justify-end gap-x-12 border-t border-border/50 bg-muted/20 px-6 py-5">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-4">Summary Totals</span>
              <div className="flex gap-x-8">
                <div className="text-right w-[120px]">
                  <div className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Current</div>
                  <MoneyText value={totals.current} className="text-sm font-bold" />
                </div>
                <div className="text-right w-[100px]">
                  <div className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Aged</div>
                  <MoneyText value={totals.days1 + totals.days31 + totals.days61 + totals.days90} className="text-sm font-bold text-orange-600" />
                </div>
                <div className="text-right border-l border-border/50 pl-8">
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Grand total</div>
                  <MoneyText value={totals.total} className="text-xl font-black text-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[11px] text-orange-600 dark:text-orange-400 font-medium">
        <AlertCircle className="h-4 w-4" />
        <span>Note: Aging is calculated based on invoice dates. Overdue status depends on your payment terms configuration.</span>
      </div>
    </div>
  );
}

function AgingCard({ title, amount, icon: Icon, color, highlight }: { title: string, amount: number, icon: any, color: string, highlight?: boolean }) {
  return (
    <Card className={cn(
      "border-border/50 shadow-none overflow-hidden relative",
      highlight ? "bg-red-500/5 ring-1 ring-red-500/20" : "bg-muted/10"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("text-[10px] uppercase font-bold tracking-widest", highlight ? "text-red-600" : "text-muted-foreground")}>{title}</div>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className="text-xl font-black tracking-tight text-foreground">
          <MoneyText value={amount} />
        </div>
      </CardContent>
    </Card>
  );
}
