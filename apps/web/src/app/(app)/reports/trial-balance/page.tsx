"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getTrialBalance } from "@/lib/api/reports";
import { useDateFormat } from "@/lib/date-format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileDown, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

type Row = {
  accountCode?: string;
  accountName?: string;
  debit?: number;
  credit?: number;
};

export default function TrialBalancePage() {
  const { dateFormat } = useDateFormat();

  // Initialize with This Year
  const initialRange = getDateRange("this_year");
  const [from, setFrom] = React.useState<Date | null>(initialRange.from);
  const [to, setTo] = React.useState<Date | null>(initialRange.to);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getTrialBalance({
        from: from?.toISOString() || undefined,
        to: to?.toISOString() || undefined,
        q: searchQuery || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load trial balance");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, searchQuery]);

  const totalDebit = rows.reduce((acc, r) => acc + (r.debit ?? 0), 0);
  const totalCredit = rows.reduce((acc, r) => acc + (r.credit ?? 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);

  const columns: Column<Row>[] = [
    {
      key: "account",
      header: "Account",
      cell: (r) => (
        <div className="py-1">
          <div className="font-medium text-foreground">{r.accountName ?? "—"}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mono-numbers">{r.accountCode ?? ""}</div>
        </div>
      ),
    },
    {
      key: "debit",
      header: <span className="w-full block text-right">Debit</span>,
      align: "right",
      width: 180,
      cell: (r) => <MoneyText value={Number(r.debit ?? 0)} className={cn(r.debit === 0 && "text-muted-foreground/40")} />,
    },
    {
      key: "credit",
      header: <span className="w-full block text-right">Credit</span>,
      align: "right",
      width: 180,
      cell: (r) => <MoneyText value={Number(r.credit ?? 0)} className={cn(r.credit === 0 && "text-muted-foreground/40")} />,
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleFilterChange = (filters: any) => {
    if (filters.dateRange) {
      setFrom(filters.dateRange.from || null);
      setTo(filters.dateRange.to || null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <PageHeader
          title="Trial Balance"
          description="Summary of all ledger balances to verify accounting entries."
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={run} disabled={loading} className="rounded-xl h-10 border-border/50">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl h-10 border-border/50">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button size="sm" className="rounded-xl h-10 shadow-lg shadow-primary/10">
            <FileDown className="mr-2 h-4 w-4" />
            Export
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
        <Card className="border-border/50 bg-blue-500/5 shadow-none overflow-hidden relative">
          <div className="absolute right-0 top-0 h-16 w-16 bg-blue-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Debit</div>
            <div className="mt-2 flex items-baseline gap-1">
              <MoneyText value={totalDebit} className="text-2xl font-bold tracking-tight" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-emerald-500/5 shadow-none overflow-hidden relative">
          <div className="absolute right-0 top-0 h-16 w-16 bg-emerald-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Credit</div>
            <div className="mt-2 flex items-baseline gap-1">
              <MoneyText value={totalCredit} className="text-2xl font-bold tracking-tight" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-border/50 shadow-none overflow-hidden relative",
          difference > 1 ? "bg-red-500/5" : "bg-primary/5"
        )}>
          <div className={cn(
            "absolute right-0 top-0 h-16 w-16 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2",
            difference > 1 ? "bg-red-500/10" : "bg-primary/10"
          )} />
          <CardContent className="pt-6">
            <div className={cn(
              "text-sm font-medium",
              difference > 1 ? "text-red-600 dark:text-red-400" : "text-primary"
            )}>
              {difference > 1 ? "Difference" : "Status"}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              {difference > 1 ? (
                <MoneyText value={difference} className="text-2xl font-bold tracking-tight" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-primary">Balanced</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 glass-card overflow-hidden shadow-xl shadow-foreground/5">
        <div className="hidden print:block p-8 text-center border-b border-border/50">
          <h1 className="text-2xl font-bold text-foreground">Lekhaly</h1>
          <h2 className="text-xl font-semibold mt-1 text-foreground">Trial Balance</h2>
          <div className="text-sm text-muted-foreground mt-2 uppercase tracking-widest font-medium">
            Period: {from?.toLocaleDateString() || "Start"} - {to?.toLocaleDateString() || "End"}
          </div>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          emptyText="No entries found for the selected period"
          className="border-none"
        />
        {rows.length > 0 && (
          <div className="flex items-center justify-end gap-x-12 border-t border-border/50 bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
              <div className="flex gap-x-8">
                <div className="text-right w-[180px]">
                  <MoneyText value={totalDebit} className="text-lg font-bold text-foreground" />
                </div>
                <div className="text-right w-[180px]">
                  <MoneyText value={totalCredit} className="text-lg font-bold text-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
