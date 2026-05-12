"use client";

import * as React from "react";
import Link from "next/link";
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

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const goods = rows.filter((r) => r.type === "goods");
  const totalValue = goods.reduce((sum, r) => sum + (r.closingAmt ?? 0), 0);
  const totalSkus = goods.length;
  const lowStockCount = goods.filter((r) => r.isLowStock).length;
  const zeroStockCount = goods.filter((r) => (r.onHandQty ?? r.closingQty ?? 0) <= 0).length;
  const features = inventoryFeatures(inventorySettings);

  // Group value by parentGroup for top-5 chart
  const groupValues = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of goods) {
      const group = r.parentGroup || "Ungrouped";
      map.set(group, (map.get(group) ?? 0) + (r.closingAmt ?? 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [goods]);

  const maxGroupValue = Math.max(...groupValues.map(([, v]) => v), 1);

  const barColors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  return (
    <div className="space-y-8 pb-20 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Inventory"
          description="Real-time overview of your stock, warehouses, and inventory health."
          icon={Package}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="rounded-2xl h-12 px-5"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          {features.inventory && <Link href="/inventory/adjust">
            <Button
              size="sm"
              className="rounded-2xl h-12 px-5 bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-500/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Adjust Stock
            </Button>
          </Link>}
          {features.warehouses && <Link href="/inventory/transfer">
            <Button
              size="sm"
              className="rounded-2xl h-12 px-5 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
            </Button>
          </Link>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Inventory Value"
          icon={Package}
          color="emerald"
          loading={loading}
        >
          <MoneyText value={totalValue} className="text-2xl font-black" />
        </KpiCard>

        <KpiCard
          label="Active SKUs"
          icon={Activity}
          color="blue"
          loading={loading}
        >
          <span className="text-2xl font-black tabular-nums">{totalSkus}</span>
        </KpiCard>

        <KpiCard
          label="Low Stock Items"
          icon={TrendingDown}
          color="amber"
          loading={loading}
          href="/items"
          badge={lowStockCount > 0 ? String(lowStockCount) : undefined}
        >
          <span className="text-2xl font-black tabular-nums">{lowStockCount}</span>
        </KpiCard>

        <KpiCard
          label="Zero Stock"
          icon={PackageX}
          color="red"
          loading={loading}
          href="/items"
          badge={zeroStockCount > 0 ? String(zeroStockCount) : undefined}
        >
          <span className="text-2xl font-black tabular-nums">{zeroStockCount}</span>
        </KpiCard>
      </div>

      {/* Two-column: Value by Group + Alerts */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Value by Group */}
        <Card className="lg:col-span-3 border-border/50 shadow-xl overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Warehouse className="h-4 w-4" /> Value by Group
              </h2>
              <Link
                href="/items"
                className="text-xs text-primary hover:underline font-medium"
              >
                View all items →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : groupValues.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No inventory data to display.
              </p>
            ) : (
              <div className="space-y-3">
                {groupValues.map(([group, value], idx) => (
                  <div key={group} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground truncate max-w-[60%]">
                        {group}
                      </span>
                      <MoneyText value={value} className="font-bold tabular-nums" />
                    </div>
                    <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
                          barColors[idx % barColors.length]
                        )}
                        style={{
                          width: `${Math.max((value / maxGroupValue) * 100, 2)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert Summary */}
        <Card className="lg:col-span-2 border-border/50 shadow-xl overflow-hidden">
          <CardContent className="pt-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Inventory Alerts
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : !alerts ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Unable to load alerts.
              </p>
            ) : (
              <div className="space-y-3">
                <AlertRow
                  icon={TrendingDown}
                  label="Below Reorder Level"
                  count={alerts.counts.belowReorder}
                  color="amber"
                />
                <AlertRow
                  icon={PackageX}
                  label="Zero Stock"
                  count={alerts.counts.zeroStock}
                  color="red"
                />
                {features.expiry && (
                  <AlertRow
                    icon={Clock}
                    label="Expiring Soon (30 days)"
                    count={alerts.counts.expiringSoon}
                    color="orange"
                  />
                )}
                <AlertRow
                  icon={AlertTriangle}
                  label="No Movement (90 days)"
                  count={alerts.counts.noMovement}
                  color="slate"
                />
              </div>
            )}

            {/* Expiring soon detail */}
            {features.expiry && alerts && alerts.expiringSoon.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Expiring Soon
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {alerts.expiringSoon.slice(0, 8).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30"
                    >
                      <div>
                        <span className="font-medium text-foreground">
                          Batch: {item.batchNo || "—"}
                        </span>
                        {item.expiryDate && (
                          <span className="ml-2 text-orange-600 dark:text-orange-400">
                            Exp: {new Date(item.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <span className="font-bold tabular-nums">{item.qty} units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/items"
          icon={Package}
          title="Items & Stock"
          desc="View all items with stock levels"
          color="emerald"
        />
        {features.warehouses && (
          <QuickLink
            href="/inventory/warehouses"
            icon={Warehouse}
            title="Warehouses"
            desc="Manage storage locations & bins"
            color="blue"
          />
        )}
        {features.inventory && (
          <QuickLink
            href="/inventory/adjust"
            icon={Plus}
            title="Stock Adjustment"
            desc="Increase or decrease item stock"
            color="amber"
          />
        )}
        {features.warehouses && (
          <QuickLink
            href="/inventory/transfer"
            icon={ArrowRightLeft}
            title="Stock Transfer"
            desc="Move stock between warehouses"
            color="purple"
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────

function KpiCard({
  label,
  icon: Icon,
  color,
  children,
  loading,
  href,
  badge,
}: {
  label: string;
  icon: any;
  color: string;
  children: React.ReactNode;
  loading?: boolean;
  href?: string;
  badge?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400",
    red: "from-red-500/10 to-red-500/5 text-red-600 dark:text-red-400",
  };

  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper {...(wrapperProps as any)}>
      <Card
        className={cn(
          "border-border/50 shadow-lg overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer",
          href && "hover:shadow-xl"
        )}
      >
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                colorMap[color]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            {badge && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="mt-1">
            {loading ? (
              <div className="h-8 w-24 rounded bg-muted animate-pulse" />
            ) : (
              children
            )}
          </div>
        </CardContent>
      </Card>
    </Wrapper>
  );
}

function AlertRow({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: any;
  label: string;
  count: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    red: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    slate: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl px-4 py-3 transition-colors",
        colorMap[color]
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-lg font-black tabular-nums">{count}</span>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
  color,
}: {
  href: string;
  icon: any;
  title: string;
  desc: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "hover:border-emerald-300 dark:hover:border-emerald-700 group-hover:text-emerald-600",
    blue: "hover:border-blue-300 dark:hover:border-blue-700 group-hover:text-blue-600",
    amber: "hover:border-amber-300 dark:hover:border-amber-700 group-hover:text-amber-600",
    purple: "hover:border-purple-300 dark:hover:border-purple-700 group-hover:text-purple-600",
  };

  return (
    <Link href={href} className="group">
      <Card
        className={cn(
          "border-border/50 transition-all duration-200 hover:shadow-lg cursor-pointer h-full",
          colorMap[color]
        )}
      >
        <CardContent className="pt-5 pb-5">
          <Icon className="h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform mb-3" />
          <h3 className="font-bold text-foreground text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
