"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import {
  getInventorySettings,
  getStockValuationReport,
  type InventorySettings,
  type StockValuationLayer,
  type StockValuationRow
} from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";
import { cn } from "@/lib/utils";
import { Button, Card, CardContent, Input } from "@lekhaly/ui";
import { FileDown, Filter, Layers, Package, RefreshCw, Search } from "lucide-react";

type TrackingFilter = "all" | "serialized" | "batch" | "lot" | "expiry" | "kit" | "standard";
type StockFilter = "all" | "with_stock" | "zero_stock";

function PolicyBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset",
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-500/20"
          : "bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:ring-slate-800"
      )}
    >
      {children}
    </span>
  );
}

function LayerSummary({ layers }: { layers: StockValuationLayer[] }) {
  if (!layers.length) return <span className="text-xs text-muted-foreground">No open layers</span>;

  return (
    <div className="space-y-2">
      {layers.slice(0, 2).map((layer, index) => (
        <div key={`${layer.receivedDate}-${index}`} className="rounded-lg border border-border/60 bg-background px-2.5 py-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-foreground">{[layer.warehouseName, layer.binName].filter(Boolean).join(" / ") || "Default stock"}</span>
            <span className="tabular-nums text-muted-foreground">{layer.qty} qty</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {layer.batchNo && <span>Batch: {layer.batchNo}</span>}
            {layer.lotNo && <span>Lot: {layer.lotNo}</span>}
            {layer.expiryDate && <span>Exp: {new Date(layer.expiryDate).toLocaleDateString()}</span>}
            <span><MoneyText value={layer.value} /></span>
          </div>
        </div>
      ))}
      {layers.length > 2 && <div className="text-[11px] font-medium text-muted-foreground">+{layers.length - 2} more layers</div>}
    </div>
  );
}

export default function StockValuationReportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<StockValuationRow[]>([]);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("all");
  const [warehouseFilter, setWarehouseFilter] = React.useState("all");
  const [trackingFilter, setTrackingFilter] = React.useState<TrackingFilter>("all");
  const [stockFilter, setStockFilter] = React.useState<StockFilter>("with_stock");

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const [report, settings] = await Promise.all([
        getStockValuationReport({ includeZero: true }),
        getInventorySettings()
      ]);
      setInventorySettings(settings);
      setRows(settings.inventoryTrackingEnabled ? report.rows : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load stock valuation report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const features = inventoryFeatures(inventorySettings);
  const groupOptions = React.useMemo(() => Array.from(new Set(rows.map((row) => row.group).filter(Boolean) as string[])).sort(), [rows]);
  const warehouseOptions = React.useMemo(() => {
    const values = new Set<string>();
    for (const row of rows) {
      for (const layer of row.layers) {
        if (layer.warehouseName) values.add(layer.warehouseName);
      }
    }
    return Array.from(values).sort();
  }, [rows]);
  const trackingOptions = React.useMemo<Array<{ value: TrackingFilter; label: string }>>(() => {
    const options: Array<{ value: TrackingFilter; label: string }> = [{ value: "all", label: "All tracking" }];
    if (features.serial) options.push({ value: "serialized", label: "Serialized" });
    if (features.batch) options.push({ value: "batch", label: "Batch tracked" });
    if (features.lot) options.push({ value: "lot", label: "Lot tracked" });
    if (features.expiry) options.push({ value: "expiry", label: "Expiry tracked" });
    if (features.kits) options.push({ value: "kit", label: "Assemblies/Kits" });
    options.push({ value: "standard", label: "Standard items" });
    return options;
  }, [features.batch, features.expiry, features.kits, features.lot, features.serial]);

  React.useEffect(() => {
    if (!trackingOptions.some((option) => option.value === trackingFilter)) setTrackingFilter("all");
  }, [trackingFilter, trackingOptions]);

  const filteredRows = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !row.name.toLowerCase().includes(q) && !(row.sku ?? "").toLowerCase().includes(q)) return false;
      if (groupFilter !== "all" && row.group !== groupFilter) return false;
      if (warehouseFilter !== "all" && !row.layers.some((layer) => layer.warehouseName === warehouseFilter)) return false;
      if (stockFilter === "with_stock" && row.totalQty <= 0) return false;
      if (stockFilter === "zero_stock" && row.totalQty !== 0) return false;
      if (trackingFilter === "serialized" && !row.isSerialized) return false;
      if (trackingFilter === "batch" && !row.tracksBatch) return false;
      if (trackingFilter === "lot" && !row.tracksLot) return false;
      if (trackingFilter === "expiry" && !row.tracksExpiry) return false;
      if (trackingFilter === "kit" && !row.isKit) return false;
      if (trackingFilter === "standard" && (row.isSerialized || row.tracksBatch || row.tracksLot || row.tracksExpiry || row.isKit)) return false;
      return true;
    });
  }, [groupFilter, rows, searchQuery, stockFilter, trackingFilter, warehouseFilter]);

  const totalQty = filteredRows.reduce((acc, row) => acc + row.totalQty, 0);
  const totalValue = filteredRows.reduce((acc, row) => acc + row.totalValue, 0);
  const layerCount = filteredRows.reduce((acc, row) => acc + row.layers.length, 0);

  const columns: Column<StockValuationRow>[] = [
    {
      key: "item",
      header: "Item / SKU",
      width: 260,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{row.name}</span>
          <span className="text-[10px] uppercase text-muted-foreground">{[row.sku, row.group].filter(Boolean).join(" / ") || "No SKU"}</span>
        </div>
      )
    },
    { key: "unit", header: "Unit", width: 90, cell: (row) => <span className="text-xs font-medium uppercase">{row.unit ?? "-"}</span> },
    {
      key: "tracking",
      header: "Tracking",
      width: 210,
      cell: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <PolicyBadge active>{row.totalQty > 0 ? "Valued" : "No stock"}</PolicyBadge>
          {features.serial && row.isSerialized && <PolicyBadge active>Serial</PolicyBadge>}
          {features.batch && row.tracksBatch && <PolicyBadge active>Batch</PolicyBadge>}
          {features.lot && row.tracksLot && <PolicyBadge active>Lot</PolicyBadge>}
          {features.expiry && row.tracksExpiry && <PolicyBadge active>Expiry</PolicyBadge>}
        </div>
      )
    },
    { key: "qty", header: <span className="block text-right">Qty</span>, align: "right", width: 110, cell: (row) => <span className="font-bold tabular-nums">{row.totalQty}</span> },
    { key: "avgCost", header: <span className="block text-right">Avg Cost</span>, align: "right", width: 130, cell: (row) => <MoneyText value={row.avgCost} className="font-semibold" /> },
    { key: "value", header: <span className="block text-right">Value</span>, align: "right", width: 150, cell: (row) => <MoneyText value={row.totalValue} className="font-black" /> },
    { key: "layers", header: "Open Layers", width: 330, cell: (row) => <LayerSummary layers={row.layers} /> }
  ];

  return (
    <div className="space-y-6 pb-20 text-foreground">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <PageHeader title="Stock Valuation Report" description="Layer-based inventory value by item, warehouse, batch, lot, and expiry policy." />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={run} disabled={loading} className="h-10 rounded-xl">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" className="h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
            <FileDown className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {inventorySettings && !features.inventory ? (
        <Card className="border-dashed border-border/70">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Enable Inventory Tracking in Configuration to use the Stock Valuation Report.
          </CardContent>
        </Card>
      ) : (
        <>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

          <Card className="border-border/50 shadow-none">
            <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(240px,1fr)_170px_170px_170px_150px]">
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
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} disabled={!features.warehouses}>
                <option value="all">{features.warehouses ? "All warehouses" : "Warehouse disabled"}</option>
                {warehouseOptions.map((warehouse) => <option key={warehouse} value={warehouse}>{warehouse}</option>)}
              </select>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={trackingFilter} onChange={(e) => setTrackingFilter(e.target.value as TrackingFilter)}>
                {trackingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as StockFilter)}>
                <option value="all">All stock</option>
                <option value="with_stock">With stock</option>
                <option value="zero_stock">Zero stock</option>
              </select>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
            <Card className="border-border/50 bg-emerald-600/5 shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600"><Package className="h-3 w-3" /> Stock Value</div>
                <div className="mt-2 text-2xl font-black"><MoneyText value={totalValue} /></div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-none">
              <CardContent className="pt-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quantity</div>
                <div className="mt-2 text-2xl font-black tabular-nums">{Number(totalQty.toFixed(2))}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-none">
              <CardContent className="pt-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Items</div>
                <div className="mt-2 text-2xl font-black tabular-nums">{filteredRows.length}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><Layers className="h-3 w-3" /> Open Layers</div>
                <div className="mt-2 text-2xl font-black tabular-nums">{layerCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-[420px] overflow-hidden border-border/50 shadow-xl">
            <DataTable
              rows={filteredRows}
              columns={columns}
              loading={loading}
              emptyText="No stock valuation data found"
              className="border-none"
              onRowClick={(row) => navigate(`/reports/stock-ledger?itemId=${row.itemId}`)}
            />
          </Card>
        </>
      )}
    </div>
  );
}
