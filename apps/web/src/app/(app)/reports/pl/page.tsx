"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { MoneyText } from "@/components/app/money";
import { getProfitLoss } from "@/lib/api/reports";
import { useDateFormat } from "@/lib/date-format";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, FileDown, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Landmark, Calculator, Columns, Rows } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getDateRange } from "@/lib/dates/ranges";

type Row = {
  section?: string;
  name?: string;
  amount?: number;
  prevAmount?: number; // For comparison
};

export default function ProfitLossPage() {
  const { dateFormat } = useDateFormat();

  // Initialize with This Year
  const initialRange = getDateRange("this_year");
  const [from, setFrom] = React.useState<Date | null>(initialRange.from);
  const [to, setTo] = React.useState<Date | null>(initialRange.to);

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"horizontal" | "vertical">("horizontal");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isComparing, setIsComparing] = React.useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getProfitLoss({
        from: from?.toISOString() || undefined,
        to: to?.toISOString() || undefined,
        q: searchQuery || undefined,
      });

      let data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];

      // If comparing, fetch previous year data
      if (isComparing && from && to) {
        const prevFrom = new Date(from);
        prevFrom.setFullYear(from.getFullYear() - 1);
        const prevTo = new Date(to);
        prevTo.setFullYear(to.getFullYear() - 1);

        const prevRes: any = await getProfitLoss({
          from: prevFrom.toISOString(),
          to: prevTo.toISOString(),
          q: searchQuery || undefined,
        });
        const prevData = Array.isArray(prevRes) ? prevRes : prevRes?.rows ?? prevRes?.data ?? prevRes?.items ?? [];

        // Merge data
        const mergedData = [...data];
        prevData.forEach((pr: any) => {
          const existing = mergedData.find(d => d.name === pr.name && d.section === pr.section);
          if (existing) {
            existing.prevAmount = pr.amount;
          } else {
            mergedData.push({ ...pr, amount: 0, prevAmount: pr.amount });
          }
        });
        data = mergedData;
      }

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
  }, [from, to, searchQuery, isComparing]);

  const categorize = (items: Row[]) => {
    const income = items.filter(r => ["income", "revenue", "operating-income", "operating income"].includes(r.section?.toLowerCase() ?? ""));
    const cogs = items.filter(r => ["cogs", "direct-expense", "direct expense", "cost of goods sold"].includes(r.section?.toLowerCase() ?? ""));
    const otherExpense = items.filter(r => (["expense", "operating-expense", "operating expense", "indirect-expense", "indirect expense", "fixed expense"].includes(r.section?.toLowerCase() ?? "")) || (r.section?.toLowerCase() === "expense" && !cogs.includes(r)));

    const rest = items.filter(r => !income.includes(r) && !cogs.includes(r) && !otherExpense.includes(r));
    rest.forEach(r => {
      const sec = r.section?.toLowerCase() ?? "";
      if (sec.includes("income")) income.push(r);
      else if (sec.includes("direct") || sec.includes("cogs")) cogs.push(r);
      else otherExpense.push(r);
    });

    return { income, cogs, otherExpense };
  };

  const { income: incomeItems, cogs: cogsItems, otherExpense: otherExpenseItems } = categorize(rows);

  const getTotals = (items: Row[]) => ({
    current: items.reduce((acc, r) => acc + (r.amount ?? 0), 0),
    prev: items.reduce((acc, r) => acc + (r.prevAmount ?? 0), 0)
  });

  const incomeTotals = getTotals(incomeItems);
  const cogsTotals = getTotals(cogsItems);
  const otherExpenseTotals = getTotals(otherExpenseItems);

  const totals = {
    income: incomeTotals.current,
    incomePrev: incomeTotals.prev,
    cogs: cogsTotals.current,
    cogsPrev: cogsTotals.prev,
    otherExpense: otherExpenseTotals.current,
    otherExpensePrev: otherExpenseTotals.prev,
    grossProfit: incomeTotals.current - cogsTotals.current,
    grossProfitPrev: incomeTotals.prev - cogsTotals.prev,
    netProfit: incomeTotals.current - (cogsTotals.current + otherExpenseTotals.current),
    netProfitPrev: incomeTotals.prev - (cogsTotals.prev + otherExpenseTotals.prev)
  };

  const handlePrint = () => { window.print(); };

  const handleFilterChange = (filters: any) => {
    if (filters.dateRange) {
      setFrom(filters.dateRange.from || null);
      setTo(filters.dateRange.to || null);
    }
    setIsComparing(!!filters.compare);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <PageHeader
          title="Profit & Loss"
          description="Detailed income and expense statement with year-over-year comparison."
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background p-1 mr-2">
            <Button variant={viewMode === "horizontal" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("horizontal")} className="h-8 rounded-lg px-3">
              <Columns className="mr-2 h-3.5 w-3.5" />
              Horizontal
            </Button>
            <Button variant={viewMode === "vertical" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("vertical")} className="h-8 rounded-lg px-3">
              <Rows className="mr-2 h-3.5 w-3.5" />
              Vertical
            </Button>
          </div>
          <button onClick={run} disabled={loading} className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all">
            <FileDown className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <AdvancedFilterBar
        className="print:hidden"
        onSearch={setSearchQuery}
        onFilterChange={handleFilterChange}
        showComparison={true}
        defaultRange="this_year"
      />

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <SummaryCard title="Total Revenue" current={totals.income} prev={totals.incomePrev} showCompare={isComparing} icon={TrendingUp} color="blue" />
        <SummaryCard title="Gross Profit" current={totals.grossProfit} prev={totals.grossProfitPrev} showCompare={isComparing} icon={Calculator} color="orange" />
        <SummaryCard title="Total Expenses" current={totals.cogs + totals.otherExpense} prev={totals.cogsPrev + totals.otherExpensePrev} showCompare={isComparing} icon={TrendingDown} color="red" />
        <SummaryCard title="Net Profit" current={totals.netProfit} prev={totals.netProfitPrev} showCompare={isComparing} icon={Landmark} color={totals.netProfit >= 0 ? "emerald" : "red"} />
      </div>

      <Card className={cn(
        "border-border/50 glass-card shadow-xl shadow-foreground/5 mx-auto print:shadow-none print:border-none",
        viewMode === "horizontal" ? "max-w-7xl" : "max-w-4xl"
      )}>
        <div className="p-8 text-center border-b border-border/50 bg-muted/20 print:bg-white text-foreground">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lekhaly</h1>
          <h2 className="text-xl font-semibold mt-1">Statement of Profit or Loss</h2>
          <div className="text-sm text-muted-foreground mt-2 uppercase tracking-widest font-medium">
            {isComparing ? (
              <>Comparison: {from?.toLocaleDateString()} - {to?.toLocaleDateString()} vs Previous Year</>
            ) : (
              <>Period: {from?.toLocaleDateString() || "Start"} - {to?.toLocaleDateString() || "End"}</>
            )}
          </div>
        </div>

        {viewMode === "vertical" ? (
          <div className="p-6 md:p-10 space-y-10">
            <Section title="Revenue" items={incomeItems} total={totals.income} prevTotal={totals.incomePrev} showCompare={isComparing} />
            <Section title="Cost of Goods Sold" items={cogsItems} total={totals.cogs} prevTotal={totals.cogsPrev} showCompare={isComparing} />
            <div className="py-4 border-y-2 border-foreground/20 bg-muted/10 -mx-8 px-8 print:bg-transparent flex items-center justify-between">
              <span className="text-md font-extrabold uppercase tracking-tighter text-foreground">Gross Profit</span>
              <div className="flex gap-12">
                {isComparing && <MoneyText value={totals.grossProfitPrev} className="text-lg font-bold text-muted-foreground/60" />}
                <MoneyText value={totals.grossProfit} className="text-lg font-black text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <Section title="Operating Expenses" items={otherExpenseItems} total={totals.otherExpense} prevTotal={totals.otherExpensePrev} showCompare={isComparing} />
            <div className="mt-12 pt-8 border-t-[3px] border-double border-foreground/30">
              <div className={cn("flex items-center justify-between p-6 rounded-2xl", totals.netProfit >= 0 ? "bg-primary/5" : "bg-red-500/5 shadow-inner")}>
                <span className="text-xl font-black uppercase tracking-tighter text-foreground">Net Profit / (Loss)</span>
                <div className="flex items-baseline gap-12">
                  {isComparing && <MoneyText value={totals.netProfitPrev} className="text-xl font-bold text-muted-foreground/40 line-through" />}
                  <MoneyText value={totals.netProfit} className={cn("text-3xl font-black tabular-nums", totals.netProfit >= 0 ? "text-primary" : "text-red-700 font-bold")} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 divide-x divide-border/50 min-h-[500px]">
            {/* Left side: Expenses */}
            <div className="p-6 md:p-8 space-y-8 flex flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4 bg-red-500/5 -mx-4 px-4 py-1 rounded-t-lg">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">Expenses</h3>
                  <div className="flex gap-8 text-[10px] uppercase font-black text-muted-foreground">
                    {isComparing && <span>Prev Year</span>}
                    <span>Current</span>
                  </div>
                </div>
                <SubSection title="Direct Expenses" items={cogsItems} showCompare={isComparing} />
                <SubSection title="Indirect Expenses" items={otherExpenseItems} showCompare={isComparing} />
                {totals.netProfit >= 0 && (
                  <div className="mt-8 pt-4 border-t border-dashed border-border/50">
                    <div className="flex items-center justify-between px-2 py-2 bg-primary/5 rounded-lg ring-1 ring-primary/10">
                      <span className="text-sm font-bold text-primary italic">Net Profit Transferred</span>
                      <div className="flex gap-8">
                        {isComparing && <MoneyText value={totals.netProfitPrev} className="font-bold text-primary/40" />}
                        <MoneyText value={totals.netProfit} className="font-black text-primary" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-6 border-t-2 border-foreground/10 px-2 sticky bottom-0 bg-background/80 backdrop-blur-sm print:bg-white text-foreground">
                <div className="flex items-center justify-between font-black uppercase tracking-tight">
                  <span>Total</span>
                  <MoneyText value={totals.netProfit >= 0 ? totals.income : (totals.cogs + totals.otherExpense)} className="text-lg" />
                </div>
              </div>
            </div>
            {/* Right side: Income */}
            <div className="p-6 md:p-8 space-y-8 flex flex-col bg-muted/5">
              <div className="flex-1">
                <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4 bg-emerald-500/5 -mx-4 px-4 py-1 rounded-t-lg">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Income</h3>
                  <div className="flex gap-8 text-[10px] uppercase font-black text-muted-foreground">
                    {isComparing && <span>Prev Year</span>}
                    <span>Current</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {incomeItems.map((item, i) => (
                    <RowItem key={i} item={item} showCompare={isComparing} />
                  ))}
                </div>
                {totals.netProfit < 0 && (
                  <div className="mt-8 pt-4 border-t border-dashed border-border/50">
                    <div className="flex items-center justify-between px-2 py-2 bg-red-500/5 rounded-lg ring-1 ring-red-500/10">
                      <span className="text-sm font-bold text-red-600 italic">Net Loss Transferred</span>
                      <div className="flex gap-8">
                        {isComparing && <MoneyText value={Math.abs(totals.netProfitPrev)} className="font-bold text-red-600/40" />}
                        <MoneyText value={Math.abs(totals.netProfit)} className="font-black text-red-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-6 border-t-2 border-foreground/10 px-2 sticky bottom-0 bg-background/80 backdrop-blur-sm print:bg-white text-foreground">
                <div className="flex items-center justify-between font-black uppercase tracking-tight">
                  <span>Total</span>
                  <MoneyText value={totals.netProfit < 0 ? (totals.cogs + totals.otherExpense) : totals.income} className="text-lg" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Section({ title, items, total, prevTotal, showCompare }: { title: string, items: Row[], total: number, prevTotal: number, showCompare: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">{title}</h3>
        <div className="flex gap-12 text-[10px] uppercase font-black text-muted-foreground mr-2">
          {showCompare && <span className="w-24 text-right">Prev Year</span>}
          <span className="w-24 text-right">Current</span>
        </div>
      </div>
      <div className="space-y-3">
        {items.length > 0 ? items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-2 hover:bg-muted/30 py-1.5 rounded-lg transition-colors text-foreground">
            <span className="text-sm font-medium">{item.name}</span>
            <div className="flex gap-12">
              {showCompare && <MoneyText value={item.prevAmount ?? 0} className="text-sm font-bold text-muted-foreground/40 w-24 text-right" />}
              <MoneyText value={item.amount ?? 0} className="text-sm font-bold text-foreground w-24 text-right" />
            </div>
          </div>
        )) : <div className="text-sm text-muted-foreground italic px-2">No data</div>}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 px-2">
        <span className="text-sm font-bold text-foreground uppercase tracking-wider">Total {title}</span>
        <div className="flex gap-12">
          {showCompare && <MoneyText value={prevTotal} className="text-base font-bold text-muted-foreground/40 w-24 text-right" />}
          <MoneyText value={total} className="text-base font-bold text-foreground w-24 text-right" />
        </div>
      </div>
    </div>
  );
}

function SubSection({ title, items, showCompare }: { title: string, items: Row[], showCompare: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <RowItem key={i} item={item} showCompare={showCompare} />
        ))}
      </div>
    </div>
  );
}

function RowItem({ item, showCompare }: { item: Row, showCompare: boolean }) {
  return (
    <div className="flex items-center justify-between px-2 py-1 text-sm hover:bg-muted/30 rounded transition-colors text-foreground">
      <span className="font-medium text-foreground">{item.name}</span>
      <div className="flex gap-8">
        {showCompare && <MoneyText value={item.prevAmount ?? 0} className="font-bold text-muted-foreground/40 w-24 text-right" />}
        <MoneyText value={item.amount ?? 0} className="font-black w-24 text-right" />
      </div>
    </div>
  )
}

function SummaryCard({ title, current, prev, showCompare, icon: Icon, color }: any) {
  const diff = current - prev;
  const pcent = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
  return (
    <Card className={cn("border-border/50 shadow-none overflow-hidden relative", `bg-${color}-500/5`)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className={cn("text-xs font-bold uppercase tracking-widest", `text-${color}-600 dark:text-${color}-400`)}>{title}</div>
          <Icon className={cn("h-4 w-4", `text-${color}-500`)} />
        </div>
        <div className="mt-2 text-xl font-bold tracking-tight">
          <MoneyText value={current} />
        </div>
        {showCompare && (
          <div className="mt-2 flex items-center gap-2">
            <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", diff >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
              {diff >= 0 ? "+" : ""}{pcent.toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted-foreground">vs prev year</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
