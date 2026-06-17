"use client";

import * as React from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { getItem, type ItemRecord } from "@/lib/api/items";
import { getItemStockLedger, getInventorySettings, type InventorySettings, type StockLedgerEntry } from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";
import { MoneyText } from "@/components/app/money";
import DataTable, { Column } from "@/components/app/data-table";
import { Card, CardContent, Button } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import { toast } from "@/components/app/toast";
import {
  ArrowLeft, Package, Tag, Layers, BarChart3, ArrowDown, ArrowUp,
  ExternalLink, Edit, RefreshCw, Box, Hash, Calendar, AlertTriangle
} from "lucide-react";

type Tab = "overview" | "ledger";

function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-300",
    red: "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-300",
    slate: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300",
    violet: "bg-violet-100 text-violet-700 ring-violet-600/20 dark:bg-violet-900/20 dark:text-violet-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset", colors[color] || colors.slate)}>
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ElementType; accent?: string }) {
  return (
    <Card className="border-border/50 shadow-none overflow-hidden group hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className={cn("text-[10px] uppercase font-bold tracking-widest", accent || "text-muted-foreground")}>{label}</div>
            <div className="mt-2 text-2xl font-black tabular-nums">{value}</div>
            {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
          </div>
          {Icon && (
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center bg-muted/50 group-hover:scale-110 transition-transform")}>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "ledger" ? "ledger" : "overview";
  const [item, setItem] = React.useState<ItemRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [settings, setSettings] = React.useState<InventorySettings | null>(null);
  const [ledger, setLedger] = React.useState<{
    openingQty?: number; openingAmt?: number;
    debitQty?: number; debitAmt?: number;
    creditQty?: number; creditAmt?: number;
    closingQty?: number; closingAmt?: number;
    entries: StockLedgerEntry[];
  } | null>(null);
  const [ledgerLoading, setLedgerLoading] = React.useState(false);

  const features = inventoryFeatures(settings);
  const isGoods = item?.type === "goods";
  const tracked = isGoods && item?.trackInventory !== false && features.inventory;

  async function loadItem() {
    if (!id) return;
    setLoading(true);
    try {
      const [itemData, inv] = await Promise.all([getItem(id), getInventorySettings()]);
      setItem(itemData);
      setSettings(inv);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load item");
    } finally {
      setLoading(false);
    }
  }

  async function loadLedger() {
    if (!id || !tracked) return;
    setLedgerLoading(true);
    try {
      const res = await getItemStockLedger(id);
      setLedger(res);
    } catch {
      setLedger(null);
    } finally {
      setLedgerLoading(false);
    }
  }

  React.useEffect(() => { loadItem(); }, [id]);
  React.useEffect(() => {
    setTab(searchParams.get("tab") === "ledger" ? "ledger" : "overview");
  }, [searchParams]);
  React.useEffect(() => { if (tab === "ledger" || tab === "overview") loadLedger(); }, [id, tracked, tab]);

  const ledgerColumns: Column<StockLedgerEntry>[] = [
    { key: "date", header: "Date", width: 120, cell: (r) => <span className="text-xs font-medium">{new Date(r.date).toLocaleDateString()}</span> },
    { key: "source", header: "Source", width: 180, cell: (r) => r.voucherId ? (
      <Link to={`/vouchers/view/${r.voucherId}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs">
        {r.voucherNumber || r.voucherType || "Voucher"}<ExternalLink className="h-3 w-3" />
      </Link>
    ) : <span className="text-muted-foreground text-xs">Opening / manual</span> },
    ...(features.warehouses ? [{ key: "location", header: "Location", width: 160, cell: (r: StockLedgerEntry) => <span className="text-xs">{[r.warehouseName, r.binName].filter(Boolean).join(" / ") || "-"}</span> } as Column<StockLedgerEntry>] : []),
    { key: "in", header: <span className="block text-right text-emerald-600">In</span>, align: "right" as const, width: 90, cell: (r) => <span className="tabular-nums text-emerald-600 font-medium">{r.qtyIn || "-"}</span> },
    { key: "out", header: <span className="block text-right text-red-600">Out</span>, align: "right" as const, width: 90, cell: (r) => <span className="tabular-nums text-red-600 font-medium">{r.qtyOut || "-"}</span> },
    { key: "rate", header: <span className="block text-right">Rate</span>, align: "right" as const, width: 120, cell: (r) => <MoneyText value={r.rate} className="text-xs" /> },
    { key: "bal", header: <span className="block text-right font-black">Balance</span>, align: "right" as const, width: 100, cell: (r) => <span className="font-black tabular-nums">{r.runningQty ?? 0}</span> },
    { key: "amt", header: <span className="block text-right">Value</span>, align: "right" as const, width: 140, cell: (r) => <MoneyText value={r.runningAmt ?? 0} className="font-semibold" /> },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-muted" />
        <div className="h-40 rounded-3xl bg-muted" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-muted" />)}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground">Item not found</h2>
        <Link to="/items"><Button variant="outline" className="mt-4 rounded-xl">Back to Items</Button></Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Package },
    ...(tracked ? [{ key: "ledger" as Tab, label: "Stock Ledger", icon: BarChart3 }] : []),
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/items" className="hover:text-foreground transition-colors">Items</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[300px]">{item.name}</span>
      </div>

      <button
        type="button"
        onClick={() => navigate("/items")}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-transparent bg-transparent px-4 text-sm font-bold text-slate-950 transition-colors hover:border-orange-600 hover:bg-orange-600 hover:text-white dark:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to all items</span>
      </button>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/10 shadow-lg shadow-primary/5">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{item.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.sku && <Badge color="violet"><Hash className="h-3 w-3 mr-1" />{item.sku}</Badge>}
                <Badge color={isGoods ? "emerald" : "blue"}>{isGoods ? "Goods" : "Services"}</Badge>
                {item.unit && <Badge><Box className="h-3 w-3 mr-1" />{item.unit}</Badge>}
                {item.isKit && <Badge color="amber">Kit</Badge>}
                {item.isSerialized && <Badge color="blue">Serialized</Badge>}
                {item.tracksBatch && <Badge>Batch</Badge>}
                {item.tracksExpiry && <Badge color="red"><Calendar className="h-3 w-3 mr-1" />Expiry</Badge>}
              </div>
              {item.hsCode && <div className="mt-2 text-xs text-muted-foreground">HS Code: <span className="font-mono font-medium">{item.hsCode}</span></div>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl h-10 gap-2" onClick={() => { loadItem(); loadLedger(); }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" className="rounded-xl h-10 gap-2 bg-primary shadow-lg shadow-primary/20" onClick={() => navigate(`/items/new?edit=${id}`)}>
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 rounded-2xl bg-muted/50 p-1 w-fit">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Pricing Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sales Price" value={<MoneyText value={item.salesPrice ?? 0} />} icon={Tag} accent="text-emerald-600" />
            <StatCard label="Purchase Price" value={<MoneyText value={item.purchasePrice ?? 0} />} icon={Tag} accent="text-blue-600" />
            {tracked && <StatCard label="Closing Stock" value={ledger?.closingQty ?? 0} sub={<MoneyText value={ledger?.closingAmt ?? 0} />} icon={Layers} accent="text-violet-600" />}
            {tracked && <StatCard label="Reorder Level" value={item.reorderLevel ?? 0} sub={`Safety stock: ${item.safetyStock ?? 0}`} icon={AlertTriangle} accent={((ledger?.closingQty ?? 0) <= (item.reorderLevel ?? 0)) ? "text-red-600" : "text-muted-foreground"} />}
          </div>

          {/* Quick Stock Summary */}
          {tracked && ledger && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Opening" value={ledger.openingQty ?? 0} sub={<MoneyText value={ledger.openingAmt ?? 0} />} icon={Package} />
              <StatCard label="Inward (Debit)" value={ledger.debitQty ?? 0} sub={<MoneyText value={ledger.debitAmt ?? 0} />} icon={ArrowDown} accent="text-emerald-600" />
              <StatCard label="Outward (Credit)" value={ledger.creditQty ?? 0} sub={<MoneyText value={ledger.creditAmt ?? 0} />} icon={ArrowUp} accent="text-red-600" />
              <Card className="border-border/50 bg-primary/5 shadow-none overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-primary">Closing Balance</div>
                  <div className="mt-2 text-3xl font-black tabular-nums">{ledger.closingQty ?? 0}</div>
                  <MoneyText value={ledger.closingAmt ?? 0} className="text-sm font-semibold mt-1" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Item Details Grid */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Item Details</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Type", value: isGoods ? "Goods" : "Services" },
                  { label: "Unit", value: item.unit || "—" },
                  { label: "SKU", value: item.sku || "—" },
                  { label: "HS Code", value: item.hsCode || "—" },
                  { label: "Track Inventory", value: item.trackInventory !== false && isGoods ? "Yes" : "No" },
                  { label: "Serialized", value: item.isSerialized ? "Yes" : "No" },
                  { label: "Kit Item", value: item.isKit ? "Yes" : "No" },
                  { label: "Batch Tracking", value: item.tracksBatch ? "Required" : "Not required" },
                  { label: "Lot Tracking", value: item.tracksLot ? "Required" : "Not required" },
                  { label: "Expiry Tracking", value: item.tracksExpiry ? "Required" : "Not required" },
                  { label: "Reorder Level", value: String(item.reorderLevel ?? 0) },
                  { label: "Safety Stock", value: String(item.safetyStock ?? 0) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-border/40 last:border-0">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stock Ledger Tab */}
      {tab === "ledger" && tracked && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Opening" value={ledger?.openingQty ?? 0} sub={<MoneyText value={ledger?.openingAmt ?? 0} />} />
            <StatCard label="Debit / Inward" value={ledger?.debitQty ?? 0} sub={<MoneyText value={ledger?.debitAmt ?? 0} />} accent="text-emerald-600" />
            <StatCard label="Credit / Outward" value={ledger?.creditQty ?? 0} sub={<MoneyText value={ledger?.creditAmt ?? 0} />} accent="text-red-600" />
            <Card className="border-border/50 bg-emerald-600/5 shadow-none"><CardContent className="pt-5"><div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Closing</div><div className="mt-2 text-2xl font-black tabular-nums">{ledger?.closingQty ?? 0}</div><MoneyText value={ledger?.closingAmt ?? 0} className="text-xs font-semibold" /></CardContent></Card>
          </div>
          <Card className="border-border/50 overflow-hidden shadow-xl min-h-[400px]">
            <DataTable
              rows={ledger?.entries ?? []}
              columns={ledgerColumns}
              loading={ledgerLoading}
              emptyText="No stock movements found"
              className="border-none"
              onRowClick={(row) => { if (row.voucherId) navigate(`/vouchers/view/${row.voucherId}`); }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
