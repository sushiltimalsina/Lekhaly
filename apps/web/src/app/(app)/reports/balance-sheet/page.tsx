"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";
import { getBalanceSheet } from "@/lib/api/reports";
import { useDateFormat } from "@/lib/date-format";
import { getDateLabel } from "@/lib/dates/display";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileDown, RefreshCw, AlertCircle, ShieldCheck, Scale, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  section?: string | "assets" | "liabilities" | "equity";
  name?: string;
  amount?: number;
};

export default function BalanceSheetPage() {
  const { dateFormat } = useDateFormat();
  const [asOf, setAsOf] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getBalanceSheet({
        asOf: asOf.ad || undefined,
        asOfBs: asOf.bs || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load balance sheet");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assetItems = rows.filter(r => r.section?.toLowerCase() === "assets");
  const liabilityItems = rows.filter(r => r.section?.toLowerCase() === "liabilities");
  const equityItems = rows.filter(r => r.section?.toLowerCase() === "equity");

  const totalAssets = assetItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);
  const totalLiabilities = liabilityItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);
  const totalEquity = equityItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);

  const balanceCheck = Math.abs(totalAssets - (totalLiabilities + totalEquity));
  const isBalanced = balanceCheck < 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <PageHeader
          title="Balance Sheet"
          description="Snapshot of assets, liabilities, and equity at a specific point in time."
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
          <div className="w-full sm:w-[240px]">
            <BsDateInput label={getDateLabel(dateFormat, "As of")} valueBs={asOf.bs} valueAd={asOf.ad} onChange={setAsOf} />
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
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Assets</div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={totalAssets} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-red-500/5 shadow-none overflow-hidden relative">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">Total Liabilities</div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={totalLiabilities} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-emerald-500/5 shadow-none overflow-hidden relative">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Equity</div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={totalEquity} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-border/50 shadow-none overflow-hidden relative", isBalanced ? "bg-primary/5" : "bg-orange-500/5")}>
          <CardContent className="pt-6">
            <div className={cn("text-sm font-medium", isBalanced ? "text-primary" : "text-orange-600")}>
              {isBalanced ? "Equation" : "Imbalance"}
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight flex items-center gap-2">
              {isBalanced ? (
                <>
                  <ShieldCheck className="h-5 w-5" /> Balanced
                </>
              ) : (
                <>
                  <Scale className="h-5 w-5" /> <MoneyText value={balanceCheck} />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 glass-card overflow-hidden shadow-xl shadow-foreground/5 max-w-5xl mx-auto">
        <div className="p-8 text-center border-b border-border/50 bg-muted/20">
          <h1 className="text-2xl font-bold tracking-tight">Lekhaly</h1>
          <h2 className="text-xl font-semibold mt-1">Balance Sheet</h2>
          <div className="text-sm text-muted-foreground mt-2 uppercase tracking-widest font-medium">
            As of {asOf.bs || asOf.ad || "Today"}
          </div>
        </div>

        <div className="grid md:grid-cols-2 divide-x divide-border/50 min-h-[500px]">
          {/* Left Column: Assets */}
          <div className="p-6 md:p-8 space-y-8">
            <div>
              <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-blue-500" /> Assets
                </h3>
              </div>
              <div className="space-y-3">
                {assetItems.length > 0 ? (
                  assetItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-2 hover:bg-muted/30 py-1.5 rounded-lg transition-colors">
                      <span className="text-sm text-foreground/80">{item.name}</span>
                      <MoneyText value={item.amount ?? 0} className="text-sm font-medium" />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic px-2">No assets recorded</div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-foreground/10 px-2 sticky bottom-0 bg-background/80 backdrop-blur-sm">
              <span className="text-sm font-black uppercase">Total Assets</span>
              <MoneyText value={totalAssets} className="text-lg font-black text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Right Column: Liabilities & Equity */}
          <div className="p-6 md:p-8 space-y-8 bg-muted/5">
            <div>
              <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
                  Liabilities
                </h3>
              </div>
              <div className="space-y-3">
                {liabilityItems.length > 0 ? (
                  liabilityItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-2 hover:bg-muted/30 py-1.5 rounded-lg transition-colors">
                      <span className="text-sm text-foreground/80">{item.name}</span>
                      <MoneyText value={item.amount ?? 0} className="text-sm font-medium" />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic px-2">No liabilities recorded</div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-border/60 pt-2 px-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Total Liabilities</span>
                <MoneyText value={totalLiabilities} className="text-sm font-bold" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2 mb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">Equity</h3>
              </div>
              <div className="space-y-3">
                {equityItems.length > 0 ? (
                  equityItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-2 hover:bg-muted/30 py-1.5 rounded-lg transition-colors">
                      <span className="text-sm text-foreground/80">{item.name}</span>
                      <MoneyText value={item.amount ?? 0} className="text-sm font-medium" />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic px-2">No equity recorded</div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-border/60 pt-2 px-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Total Equity</span>
                <MoneyText value={totalEquity} className="text-sm font-bold" />
              </div>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-foreground/10 px-2 sticky bottom-0 bg-background/80 backdrop-blur-sm">
              <span className="text-sm font-black uppercase">Total Liabilities & Equity</span>
              <MoneyText value={totalLiabilities + totalEquity} className="text-lg font-black text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-muted/30 px-8 py-4 text-[10px] text-muted-foreground flex justify-between items-center border-t border-border/50 italic">
          <span>Generated via Lekhaly ERP • Professional Financial Statement</span>
          <div className="flex items-center gap-4">
            <span className="mono-numbers uppercase tracking-tighter">Balanced: {isBalanced ? "Yes" : "No"}</span>
            <span className="mono-numbers">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
