"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";
import { getProfitLoss } from "@/lib/api/reports";
import { useDateFormat } from "@/lib/date-format";
import { getDateLabel } from "@/lib/dates/display";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, FileDown, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Landmark, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  section?: string;
  name?: string;
  amount?: number;
};

export default function ProfitLossPage() {
  const { dateFormat } = useDateFormat();
  const [from, setFrom] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [to, setTo] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getProfitLoss({
        from: from.ad || undefined,
        to: to.ad || undefined,
        fromBs: from.bs || undefined,
        toBs: to.bs || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load profit & loss");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Section categorization logic
  const incomeItems = rows.filter(r =>
    ["income", "revenue", "operating-income", "operating income"].includes(r.section?.toLowerCase() ?? "")
  );

  const cogsItems = rows.filter(r =>
    ["cogs", "direct-expense", "direct expense", "cost of goods sold"].includes(r.section?.toLowerCase() ?? "")
  );

  const otherExpenseItems = rows.filter(r =>
    ["expense", "operating-expense", "operating expense", "indirect-expense", "indirect expense", "fixed expense"].includes(r.section?.toLowerCase() ?? "")
    || (r.section?.toLowerCase() === "expense" && !cogsItems.includes(r))
  );

  // If items didn't match the above filter (fallback for backward compatibility or simple data)
  const remainingRows = rows.filter(r =>
    !incomeItems.includes(r) && !cogsItems.includes(r) && !otherExpenseItems.includes(r)
  );

  // Distribute remaining rows
  remainingRows.forEach(r => {
    const sec = r.section?.toLowerCase() ?? "";
    if (sec.includes("income")) incomeItems.push(r);
    else if (sec.includes("direct") || sec.includes("cogs")) cogsItems.push(r);
    else otherExpenseItems.push(r);
  });

  const totalIncome = incomeItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);
  const totalCogs = cogsItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);
  const grossProfit = totalIncome - totalCogs;

  const totalOtherExpense = otherExpenseItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);
  const netProfit = grossProfit - totalOtherExpense;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <PageHeader
          title="Profit & Loss"
          description="Detailed income and expense statement for your business performance."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all">
            <FileDown className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <FiltersBar
        className="print:hidden"
        left={
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-[240px]">
              <BsDateInput label={getDateLabel(dateFormat, "From")} valueBs={from.bs} valueAd={from.ad} onChange={setFrom} />
            </div>
            <div className="w-full sm:w-[240px]">
              <BsDateInput label={getDateLabel(dateFormat, "To")} valueBs={to.bs} valueAd={to.ad} onChange={setTo} />
            </div>
          </div>
        }
      />

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <Card className="border-border/50 bg-blue-500/5 shadow-none overflow-hidden relative">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Income</div>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={totalIncome} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-orange-500/5 shadow-none overflow-hidden relative">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Gross Profit</div>
              <Calculator className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={grossProfit} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-red-500/5 shadow-none overflow-hidden relative">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-red-600 dark:text-red-400">Total Expenses</div>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={totalOtherExpense + totalCogs} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-border/50 shadow-none overflow-hidden relative",
          netProfit >= 0 ? "bg-primary/5" : "bg-red-500/5"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className={cn(
                "text-sm font-medium",
                netProfit >= 0 ? "text-primary" : "text-red-600 dark:text-red-400"
              )}>
                Net Profit
              </div>
              <Landmark className={cn("h-4 w-4", netProfit >= 0 ? "text-primary" : "text-red-500")} />
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={netProfit} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 glass-card overflow-hidden shadow-xl shadow-foreground/5 max-w-4xl mx-auto">
        <div className="p-8 text-center border-b border-border/50 bg-muted/20">
          <h1 className="text-2xl font-bold tracking-tight">Lekhaly</h1>
          <h2 className="text-xl font-semibold mt-1">Statement of Profit or Loss</h2>
          <div className="text-sm text-muted-foreground mt-2">
            For the period {from.bs || from.ad || "Beginning"} to {to.bs || to.ad || "Today"}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-10">
          {/* Income Section */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">Revenue</h3>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Amount</span>
            </div>
            <div className="space-y-3">
              {incomeItems.length > 0 ? (
                incomeItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-2 hover:bg-muted/30 py-1.5 rounded-lg transition-colors">
                    <span className="text-sm text-foreground/80">{item.name}</span>
                    <MoneyText value={item.amount ?? 0} className="text-sm font-medium" />
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic px-2">No revenue recorded</div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 px-2">
              <span className="text-sm font-bold text-foreground">Total Revenue</span>
              <MoneyText value={totalIncome} className="text-base font-bold text-foreground" />
            </div>
          </div>

          {/* COGS Section */}
          {cogsItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">Cost of Goods Sold</h3>
              </div>
              <div className="space-y-3">
                {cogsItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-2 hover:bg-muted/30 py-1.5 rounded-lg transition-colors">
                    <span className="text-sm text-foreground/80">{item.name}</span>
                    <MoneyText value={item.amount ?? 0} className="text-sm font-medium" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 px-2">
                <span className="text-sm font-bold text-foreground">Total COGS</span>
                <MoneyText value={totalCogs} className="text-base font-bold text-foreground" />
              </div>
            </div>
          )}

          {/* Gross Profit Subtotal */}
          <div className="py-4 border-y-2 border-foreground/20 bg-muted/10 -mx-8 px-8">
            <div className="flex items-center justify-between">
              <span className="text-md font-extrabold uppercase tracking-tighter">Gross Profit</span>
              <MoneyText value={grossProfit} className="text-lg font-black text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          {/* Operating Expenses Section */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">Operating Expenses</h3>
            </div>
            <div className="space-y-3">
              {otherExpenseItems.length > 0 ? (
                otherExpenseItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-2 hover:bg-muted/30 py-1.5 rounded-lg transition-colors">
                    <span className="text-sm text-foreground/80">{item.name}</span>
                    <MoneyText value={item.amount ?? 0} className="text-sm font-medium" />
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground italic px-2">No operating expenses recorded</div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 px-2">
              <span className="text-sm font-bold text-foreground">Total Operating Expenses</span>
              <MoneyText value={totalOtherExpense} className="text-base font-bold text-foreground" />
            </div>
          </div>

          {/* Net Profit Section */}
          <div className="mt-12 pt-8 border-t-[3px] border-double border-foreground/30">
            <div className={cn(
              "flex items-center justify-between p-6 rounded-2xl",
              netProfit >= 0 ? "bg-primary/5" : "bg-red-500/5 shadow-inner"
            )}>
              <span className="text-xl font-black uppercase tracking-tighter">Net Profit / (Loss)</span>
              <MoneyText value={netProfit} className={cn(
                "text-3xl font-black tabular-nums",
                netProfit >= 0 ? "text-primary" : "text-red-700"
              )} />
            </div>
          </div>
        </div>

        <div className="bg-muted/30 px-8 py-4 text-[10px] text-muted-foreground flex justify-between items-center border-t border-border/50 italic">
          <span>Generated via Lekhaly ERP • Standard Financial Reporting</span>
          <div className="flex gap-4">
            <span className="mono-numbers uppercase tracking-tighter font-bold">Gross Margin: {totalIncome > 0 ? ((grossProfit / totalIncome) * 100).toFixed(2) : 0}%</span>
            <span className="mono-numbers">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
