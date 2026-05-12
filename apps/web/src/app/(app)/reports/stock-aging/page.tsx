"use client";

import * as React from "react";
import DualDateInput from "@/components/app/dual-date-input";
import PageHeader from "@/components/app/page-header";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import {
  getInventorySettings,
  getStockAgingReport,
  type InventorySettings,
  type StockAgingBucketKey,
  type StockAgingRow
} from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";
import { cn } from "@/lib/utils";
import { Button, Card, CardContent, Input } from "@lekhaly/ui";
import { FileDown, Filter, Package, RefreshCw, Search, TimerReset } from "lucide-react";

const bucketLabels: Array<{ key: StockAgingBucketKey; label: string }> = [
  { key: "0-30", label: "0-30 Days" },
  { key: "31-60", label: "31-60 Days" },
  { key: "61-90", label: "61-90 Days" },
  { key: "91-180", label: "91-180 Days" },
  { key: "181-365", label: "181-365 Days" },
  { key: "365+", label: "365+ Days" }
];

type ValuationMethod = "fifo" | "weighted_average";
type TrackingFilter = "all" | "serialized" | "batch" | "lot" | "expiry" | "kit" | "standard";

function BucketCell({ row, bucket }: { row: StockAgingRow; bucket: StockAgingBucketKey }) {
  const value = row.buckets[bucket];
  return (
    <div className="text-right leading-tight tabular-nums">
      <div className="font-bold">{value.qty}</div>
      <MoneyText value={value.value} className="text-[11px] text-muted-foreground" />
    </div>
  );
}

export default function StockAgingReportPage() {
  const [asOfDate, setAsOfDate] = React.useState({ ad: "", bs: "" });
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<StockAgingRow[]>([]);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [hasRun, setHasRun] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("all");
  const [bucketFilter, setBucketFilter] = React.useState<StockAgingBucketKey | "all">("all");
  const [stockFilter, setStockFilter] = React.useState<"all" | "with_stock" | "zero_stock">("all");
  const [trackingFilter, setTrackingFilter] = React.useState<TrackingFilter>("all");
  const [valuationMethod, setValuationMethod] = React.useState<ValuationMethod>("fifo");

  async function run() {
    if (!asOfDate.ad) {
      setError("Select an as-of date before generating the Stock Aging Report.");
      setRows([]);
      setHasRun(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [report, settings] = await Promise.all([
        getStockAgingReport({
          asOf: new Date(`${asOfDate.ad}T23:59:59`).toISOString(),
          asOfBs: asOfDate.bs || undefined,
          includeZero: true,
          valuationMethod
        }),
        getInventorySettings()
      ]);
      setInventorySettings(settings);
      setRows(settings.inventoryTrackingEnabled ? report.rows : []);
      setHasRun(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load stock aging report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    getInventorySettings().then(setInventorySettings).catch(() => setInventorySettings(null));
  }, []);

  const features = inventoryFeatures(inventorySettings);
  const groupOptions = React.useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.group).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  }, [rows]);
  const filteredRows = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !row.name.toLowerCase().includes(q) && !(row.sku ?? "").toLowerCase().includes(q)) return false;
      if (groupFilter !== "all" && row.group !== groupFilter) return false;
      if (stockFilter === "with_stock" && row.totalQty <= 0) return false;
      if (stockFilter === "zero_stock" && row.totalQty !== 0) return false;
      if (bucketFilter !== "all" && row.buckets[bucketFilter].qty <= 0) return false;
      if (trackingFilter === "serialized" && !row.isSerialized) return false;
      if (trackingFilter === "batch" && !row.tracksBatch) return false;
      if (trackingFilter === "lot" && !row.tracksLot) return false;
      if (trackingFilter === "expiry" && !row.tracksExpiry) return false;
      if (trackingFilter === "kit" && !row.isKit) return false;
      if (trackingFilter === "standard" && (row.isSerialized || row.tracksBatch || row.tracksLot || row.tracksExpiry || row.isKit)) return false;
      return true;
    });
  }, [bucketFilter, groupFilter, rows, searchQuery, stockFilter, trackingFilter]);
  const totalQty = filteredRows.reduce((acc, row) => acc + row.totalQty, 0);
  const totalValue = filteredRows.reduce((acc, row) => acc + row.totalValue, 0);
  const oldestAge = filteredRows.reduce((acc, row) => Math.max(acc, row.oldestAgeDays), 0);

  const columns: Column<StockAgingRow>[] = [
    {
      key: "item",
      header: "Item",
      width: 260,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{row.name}</span>
          <span className="text-[10px] uppercase text-muted-foreground">
            {[row.sku, row.group].filter(Boolean).join(" / ") || "No SKU"}
          </span>
        </div>
      )
    },
    { key: "unit", header: "Unit", width: 90, cell: (row) => <span className="text-xs uppercase">{row.unit ?? "-"}</span> },
    { key: "totalQty", header: <span className="block text-right">Qty</span>, align: "right", width: 100, cell: (row) => <span className="font-bold tabular-nums">{row.totalQty}</span> },
    { key: "totalValue", header: <span className="block text-right">Value</span>, align: "right", width: 140, cell: (row) => <MoneyText value={row.totalValue} className="font-bold" /> },
    { key: "avgAge", header: <span className="block text-right">Avg Age</span>, align: "right", width: 110, cell: (row) => <span>{row.avgAgeDays} days</span> },
    ...bucketLabels.map<Column<StockAgingRow>>((bucket) => ({
      key: bucket.key,
      header: <span className="block text-right">{bucket.label}</span>,
      align: "right",
      width: 135,
      cell: (row) => <BucketCell row={row} bucket={bucket.key} />
    }))
  ];

  return (
    <div className="space-y-6 pb-20 text-foreground">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <PageHeader title="Stock Aging Report" description="FIFO-based inventory aging prepared in Nepal reporting format." />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={run} disabled={loading} className="h-10 rounded-xl">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" disabled={!hasRun} className="h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
            <FileDown className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {inventorySettings && !features.inventory ? (
        <Card className="border-dashed border-border/70">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Enable Inventory Tracking in Configuration to use the Stock Aging Report.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/50 shadow-none">
            <CardContent className="grid gap-4 p-4 md:grid-cols-[260px_220px_1fr] md:items-end">
              <DualDateInput label="As of Date" value={asOfDate} onChange={setAsOfDate} required />
              <label className="space-y-2 text-sm font-medium">
                <span className="text-muted-foreground">Valuation Basis</span>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={valuationMethod} onChange={(e) => setValuationMethod(e.target.value as ValuationMethod)}>
                  <option value="fifo">FIFO</option>
                  <option value="weighted_average">Weighted Average</option>
                </select>
              </label>
              <div className="text-xs text-muted-foreground">
                Select an as-of date and valuation basis, then generate the report. Age buckets follow the standard Nepal stock aging layout and values are shown in NPR.
              </div>
            </CardContent>
          </Card>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

          {hasRun && (
            <Card className="border-border/50 shadow-none">
              <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_170px_170px_170px_150px]">
                <label className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search item or SKU..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </label>
                <label className="relative">
                  <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                    <option value="all">All groups</option>
                    {groupOptions.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                </label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={bucketFilter} onChange={(e) => setBucketFilter(e.target.value as StockAgingBucketKey | "all")}>
                  <option value="all">All age buckets</option>
                  {bucketLabels.map((bucket) => <option key={bucket.key} value={bucket.key}>{bucket.label}</option>)}
                </select>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={trackingFilter} onChange={(e) => setTrackingFilter(e.target.value as TrackingFilter)}>
                  <option value="all">All tracking</option>
                  <option value="serialized">Serialized</option>
                  <option value="batch">Batch tracked</option>
                  <option value="lot">Lot tracked</option>
                  <option value="expiry">Expiry tracked</option>
                  <option value="kit">Assemblies/Kits</option>
                  <option value="standard">Standard items</option>
                </select>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as "all" | "with_stock" | "zero_stock")}>
                  <option value="all">All stock</option>
                  <option value="with_stock">With stock</option>
                  <option value="zero_stock">Zero stock</option>
                </select>
              </CardContent>
            </Card>
          )}

          {hasRun && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
            <Card className="border-border/50 bg-emerald-600/5 shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600"><Package className="h-3 w-3" /> Closing Stock Value</div>
                <div className="mt-2 text-2xl font-black"><MoneyText value={totalValue} /></div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-none">
              <CardContent className="pt-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Closing Quantity</div>
                <div className="mt-2 text-2xl font-black tabular-nums">{Number(totalQty.toFixed(2))}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><TimerReset className="h-3 w-3" /> Oldest Stock</div>
                <div className="mt-2 text-2xl font-black">{oldestAge} days</div>
              </CardContent>
            </Card>
          </div>}

          <Card className="min-h-[420px] overflow-hidden border-border/50 shadow-xl">
            {hasRun ? (
              <DataTable rows={filteredRows} columns={columns} loading={loading} emptyText="No aged stock found" className="border-none" />
            ) : (
              <CardContent className="flex min-h-[360px] items-center justify-center text-center text-sm text-muted-foreground">
                Select an as-of date and click Refresh to generate the Stock Aging Report.
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
