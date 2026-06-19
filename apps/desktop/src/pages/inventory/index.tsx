// apps/desktop/src/pages/inventory/index.tsx
import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { MoneyText } from "@/components/app/money";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingDown,
  ArrowRightLeft,
  Plus,
  RefreshCw,
  Clock,
  ShieldAlert,
  PackageX,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarCheck,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStockReport,
  getInventoryAlerts,
  getInventorySettings,
  type StockReportRow,
  type InventoryAlerts,
  type InventorySettings,
} from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";

export default function InventoryDashboardPage() {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState<StockReportRow[]>([]);
  const [alerts, setAlerts] = React.useState<InventoryAlerts | null>(null);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, alertData, settingsData] = await Promise.all([
        getStockReport(),
        getInventoryAlerts({ expiringWithinDays: 30, noMovementDays: 90, limit: 50 }),
        getInventorySettings(),
      ]);
      setRows(Array.isArray(stockData) ? stockData : []);
      setAlerts(alertData);
      setInventorySettings(settingsData);
    } catch {
      setRows([]);
      setAlerts(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const goods = rows.filter((r) => r.type === "goods");
  const totalValue = goods.reduce((sum, r) => sum + (r.closingAmt ?? 0), 0);
  const totalSkus = goods.length;
  const lowStockCount = goods.filter((r) => r.isLowStock).length;
  const zeroStockCount = goods.filter((r) => (r.onHandQty ?? r.closingQty ?? 0) <= 0).length;
  const features = inventoryFeatures(inventorySettings);

  const groupValues = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of goods) {
      const group = r.parentGroup || "Ungrouped";
      map.set(group, (map.get(group) ?? 0) + (r.closingAmt ?? 0));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [goods]);

  const maxGroupValue = Math.max(...groupValues.map(([, v]) => v), 1);
  const barColors = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-cyan-500"];

  return (
    <div className="space-y-8 pb-20 text-foreground animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title="Inventory" description="Real-time overview of your stock, warehouses, and inventory health." icon={Package} />
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="rounded-2xl h-12 px-5">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
          </Button>
          {features.inventory && <Button size="sm" onClick={() => navigate("/inventory/adjust")} className="rounded-2xl h-12 px-5 bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-500/20">
            <Plus className="mr-2 h-4 w-4" /> Adjust Stock
          </Button>}
          {features.warehouses && <Button size="sm" onClick={() => navigate("/inventory/transfer")} className="rounded-2xl h-12 px-5 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
          </Button>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Inventory Value", icon: Package, color: "emerald", content: <MoneyText value={totalValue} className="text-2xl font-black" /> },
          { label: "Active SKUs", icon: Activity, color: "blue", content: <span className="text-2xl font-black tabular-nums">{totalSkus}</span> },
          { label: "Low Stock Items", icon: TrendingDown, color: "amber", content: <span className="text-2xl font-black tabular-nums">{lowStockCount}</span> },
          { label: "Zero Stock", icon: PackageX, color: "red", content: <span className="text-2xl font-black tabular-nums">{zeroStockCount}</span> },
        ].map(({ label, icon: Icon, color, content }) => (
          <Card key={label} className="border-border/50 shadow-lg overflow-hidden transition-transform hover:scale-[1.02]">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", `from-${color}-500/10 to-${color}-500/5 text-${color}-600`)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{label}</div>
              <div className="mt-1">{loading ? <div className="h-8 w-24 rounded bg-muted animate-pulse" /> : content}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-border/50 shadow-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Warehouse className="h-4 w-4" /> Value by Group</h2>
              <button onClick={() => navigate("/items")} className="text-xs text-primary hover:underline font-medium">View all items →</button>
            </div>
            {loading ? (
              <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : groupValues.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No inventory data.</p>
            ) : (
              <div className="space-y-3">
                {groupValues.map(([group, value], idx) => (
                  <div key={group} className="space-y-1">
                    <div className="flex items-center justify-between text-sm"><span className="font-medium text-foreground truncate max-w-[60%]">{group}</span><MoneyText value={value} className="font-bold tabular-nums" /></div>
                    <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out", barColors[idx % barColors.length])} style={{ width: `${Math.max((value / maxGroupValue) * 100, 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50 shadow-xl overflow-hidden">
          <CardContent className="pt-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6"><ShieldAlert className="h-4 w-4 text-amber-500" /> Inventory Alerts</h2>
            {loading ? (
              <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : !alerts ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Unable to load alerts.</p>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: TrendingDown, label: "Below Reorder Level", count: alerts.counts.belowReorder, color: "amber" },
                  { icon: PackageX, label: "Zero Stock", count: alerts.counts.zeroStock, color: "red" },
                  ...(features.expiry ? [{ icon: Clock, label: "Expiring Soon (30 days)", count: alerts.counts.expiringSoon, color: "orange" }] : []),
                  { icon: AlertTriangle, label: "No Movement (90 days)", count: alerts.counts.noMovement, color: "slate" },
                ].map(({ icon: Icon, label, count, color }) => (
                  <div key={label} className={cn("flex items-center justify-between rounded-xl px-4 py-3 transition-colors", `text-${color}-600 bg-${color}-50 dark:bg-${color}-900/20 dark:text-${color}-400`)}>
                    <div className="flex items-center gap-3"><Icon className="h-4 w-4 shrink-0" /><span className="text-sm font-medium">{label}</span></div>
                    <span className="text-lg font-black tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/items", icon: Package, title: "Items & Stock", desc: "View all items with stock levels" },
          ...(features.warehouses ? [{ href: "/inventory/warehouses", icon: Warehouse, title: "Warehouses", desc: "Manage storage locations & bins" }] : []),
          ...(features.inventory ? [{ href: "/inventory/adjust", icon: Plus, title: "Stock Adjustment", desc: "Increase or decrease item stock" }] : []),
          ...(features.warehouses ? [{ href: "/inventory/transfer", icon: ArrowRightLeft, title: "Stock Transfer", desc: "Move stock between warehouses" }] : []),
          ...(features.goodsReceipt ? [{ href: "/inventory/goods-receipt", icon: ArrowDownToLine, title: "Goods Receipt", desc: "Receive purchased stock into inventory" }] : []),
          ...(features.inventory ? [{ href: "/inventory/dispatch", icon: ArrowUpFromLine, title: "Delivery / Dispatch", desc: "Issue stock for customer delivery" }] : []),
          ...(features.inventory ? [{ href: "/inventory/reservations", icon: ShoppingCart, title: "Reservations", desc: "View sales order stock reservations" }] : []),
          ...(features.inventory ? [{ href: "/inventory/reorder", icon: PackageSearch, title: "Reorder Suggestions", desc: "Suggested purchase quantities" }] : []),
          ...(features.inventory ? [{ href: "/inventory/approvals", icon: ShieldCheck, title: "Movement Approvals", desc: "Approve and reverse stock movements" }] : []),
          ...(features.inventory ? [{ href: "/inventory/period-close", icon: CalendarCheck, title: "Period Close", desc: "Save inventory valuation snapshots" }] : []),
          ...(features.batch || features.lot || features.expiry ? [{ href: "/inventory/batch-lots", icon: PackageSearch, title: "Batch & Lot Master", desc: "Review selectable tracked stock" }] : []),
        ].map(({ href, icon: Icon, title, desc }) => (
          <div key={href} className="cursor-pointer group" onClick={() => navigate(href)}>
            <Card className="border-border/50 transition-all duration-200 hover:shadow-lg h-full">
              <CardContent className="pt-5 pb-5">
                <Icon className="h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform mb-3" />
                <h3 className="font-bold text-foreground text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
