"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/app/page-header";
import ReportFilterBar, { type ReportFilterField } from "@/components/app/report-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getInventorySettings, getItemStockLedger, getStockReport, StockReportRow, type InventorySettings, type StockLedgerEntry } from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { RefreshCw, Package, ArrowUp, ArrowDown, FileDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange, type DateRangeKey } from "@/lib/dates/ranges";

function PolicyBadge({ enabled, label, offLabel = "Not required" }: { enabled: boolean; label: string; offLabel?: string }) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset",
            enabled
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-500/20"
                : "bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:ring-slate-800"
        )}>
            {enabled ? label : offLabel}
        </span>
    );
}

function formatSourceType(source?: string | null) {
    if (!source) return "Voucher";
    return source
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function getVoucherHref(voucherId?: string | null) {
    return voucherId ? `/vouchers/${voucherId}` : null;
}

function StockLedgerPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedItemId = searchParams.get("itemId");
    const initialRange = getDateRange("this_year");
    const [dateRange, setDateRange] = React.useState<DateRangeKey>("this_year");
    const [from, setFrom] = React.useState<Date | null>(initialRange.from);
    const [to, setTo] = React.useState<Date | null>(initialRange.to);
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<StockReportRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [movementFilter, setMovementFilter] = React.useState<"all" | "inward" | "outward">("all");
    const [sourceFilter, setSourceFilter] = React.useState("all");
    const [locationFilter, setLocationFilter] = React.useState("all");
    const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
    const [itemLedger, setItemLedger] = React.useState<{
        itemId: string;
        item?: { id: string; name: string; sku?: string | null; unit?: string | null; group?: string | null; isSerialized?: boolean; tracksBatch?: boolean; tracksLot?: boolean; tracksExpiry?: boolean };
        openingQty?: number;
        openingAmt?: number;
        debitQty?: number;
        debitAmt?: number;
        creditQty?: number;
        creditAmt?: number;
        closingQty?: number;
        closingAmt?: number;
        entries: StockLedgerEntry[];
    } | null>(null);

    async function run() {
        setLoading(true);
        setError(null);
        try {
            if (selectedItemId) {
                const [ledger, settings] = await Promise.all([
                    getItemStockLedger(selectedItemId, {
                        from: from?.toISOString(),
                        to: to?.toISOString()
                    }),
                    getInventorySettings()
                ]);
                setInventorySettings(settings);
                setItemLedger(settings.inventoryTrackingEnabled ? ledger : null);
                setRows([]);
                return;
            }
            const [res, settings] = await Promise.all([
                getStockReport({
                    from: from?.toISOString(),
                    to: to?.toISOString()
                }),
                getInventorySettings()
            ]);
            setInventorySettings(settings);
            setItemLedger(null);

            let data = settings.inventoryTrackingEnabled && Array.isArray(res) ? res : [];
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                data = data.filter(r => r.name.toLowerCase().includes(q) || (r.sku && r.sku.toLowerCase().includes(q)));
            }
            setRows(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load stock ledger");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, searchQuery, selectedItemId]);

    const totalValue = rows.reduce((acc, r) => acc + (r.closingAmt ?? 0), 0);
    const features = inventoryFeatures(inventorySettings);
    const selectedItem = itemLedger?.item;
    const showItemTrackingColumn = Boolean(
        (features.batch && selectedItem?.tracksBatch) ||
        (features.lot && selectedItem?.tracksLot) ||
        (features.expiry && selectedItem?.tracksExpiry)
    );
    const sourceOptions = React.useMemo(() => {
        const values = new Map<string, string>();
        for (const entry of itemLedger?.entries ?? []) {
            if (entry.voucherType) {
                values.set(entry.voucherType, formatSourceType(entry.voucherType));
            }
        }
        return [{ value: "all", label: "All Sources" }, ...Array.from(values, ([value, label]) => ({ value, label }))];
    }, [itemLedger]);
    const locationOptions = React.useMemo(() => {
        const values = new Map<string, string>();
        for (const entry of itemLedger?.entries ?? []) {
            const key = features.bins ? (entry.binId || entry.warehouseId) : entry.warehouseId;
            const label = features.bins
                ? [entry.warehouseName, entry.binName].filter(Boolean).join(" / ")
                : entry.warehouseName;
            if (key && label) values.set(key, label);
        }
        return [{ value: "all", label: "All Locations" }, ...Array.from(values, ([value, label]) => ({ value, label }))];
    }, [features.bins, itemLedger]);
    const stockLedgerFilterFields: ReportFilterField[] = selectedItemId ? [
        {
            key: "movement",
            label: "Movement",
            value: movementFilter,
            onChange: (value) => setMovementFilter(value as "all" | "inward" | "outward"),
            options: [
                { value: "all", label: "All Movements" },
                { value: "inward", label: "Debit / Inward" },
                { value: "outward", label: "Credit / Outward" }
            ]
        },
        {
            key: "source",
            label: "Source",
            value: sourceFilter,
            onChange: setSourceFilter,
            options: sourceOptions
        },
        {
            key: "location",
            label: features.bins ? "Warehouse / Bin" : "Warehouse",
            value: locationFilter,
            onChange: setLocationFilter,
            hidden: !features.warehouses,
            options: locationOptions
        }
    ] : [];
    const filteredItemLedgerEntries = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return (itemLedger?.entries ?? []).filter((entry) => {
            if (movementFilter === "inward" && !(entry.qtyIn > 0)) return false;
            if (movementFilter === "outward" && !(entry.qtyOut > 0)) return false;
            if (sourceFilter !== "all" && entry.voucherType !== sourceFilter) return false;
            if (locationFilter !== "all") {
                const key = features.bins ? (entry.binId || entry.warehouseId) : entry.warehouseId;
                if (key !== locationFilter) return false;
            }
            if (!q) return true;
            return [
                entry.voucherNumber,
                entry.voucherType,
                entry.warehouseName,
                entry.binName,
                entry.batchNo,
                entry.lotNo
            ].some((value) => value?.toLowerCase().includes(q));
        });
    }, [features.bins, itemLedger, locationFilter, movementFilter, searchQuery, sourceFilter]);
    const itemLedgerColumns: Column<StockLedgerEntry>[] = [
        { key: "date", header: "Date", width: 130, cell: (r) => <div className="text-xs font-medium">{new Date(r.date).toLocaleDateString()}</div> },
        {
            key: "voucher",
            header: "Source",
            width: 170,
            cell: (r) => getVoucherHref(r.voucherId) ? (
                <Link href={getVoucherHref(r.voucherId)!} className="inline-flex flex-col font-semibold text-primary hover:underline">
                    <span className="inline-flex items-center gap-1">
                        {r.voucherNumber || formatSourceType(r.voucherType)}
                        <ExternalLink className="h-3 w-3" />
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{formatSourceType(r.voucherType)}</span>
                </Link>
            ) : <span className="text-muted-foreground">Opening / manual</span>
        },
        {
            key: "sourceType",
            header: "Source Type",
            width: 130,
            cell: (r) => r.voucherId ? (
                <span className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                    {formatSourceType(r.voucherType)}
                </span>
            ) : (
                <span className="rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground">
                    Opening
                </span>
            )
        },
        ...(features.warehouses ? [{
            key: "location",
            header: features.bins ? "Warehouse / Bin" : "Warehouse",
            width: 180,
            cell: (r: StockLedgerEntry) => <span className="text-xs">{[r.warehouseName, features.bins ? r.binName : null].filter(Boolean).join(" / ") || "-"}</span>
        } as Column<StockLedgerEntry>] : []),
        { key: "debitQty", header: <span className="block text-right text-emerald-600">Debit Qty</span>, align: "right", width: 110, cell: (r) => <span className="tabular-nums text-emerald-600">{r.qtyIn || "-"}</span> },
        { key: "debitAmt", header: <span className="block text-right text-emerald-600">Debit Amount</span>, align: "right", width: 150, cell: (r) => <MoneyText value={r.debitAmt ?? 0} className="text-emerald-600 font-semibold" /> },
        { key: "creditQty", header: <span className="block text-right text-red-600">Credit Qty</span>, align: "right", width: 110, cell: (r) => <span className="tabular-nums text-red-600">{r.qtyOut || "-"}</span> },
        { key: "creditAmt", header: <span className="block text-right text-red-600">Credit Amount</span>, align: "right", width: 150, cell: (r) => <MoneyText value={r.creditAmt ?? 0} className="text-red-600 font-semibold" /> },
        { key: "closingQty", header: <span className="block text-right">Closing Qty</span>, align: "right", width: 120, cell: (r) => <span className="font-black tabular-nums">{r.runningQty ?? 0}</span> },
        { key: "closingAmt", header: <span className="block text-right">Closing Amount</span>, align: "right", width: 150, cell: (r) => <MoneyText value={r.runningAmt ?? 0} className="font-bold" /> },
        ...(showItemTrackingColumn ? [{
            key: "tracking",
            header: "Tracking",
            width: 220,
            cell: (r: StockLedgerEntry) => <span className="text-xs text-muted-foreground">{[
                features.batch && selectedItem?.tracksBatch && r.batchNo && `Batch ${r.batchNo}`,
                features.lot && selectedItem?.tracksLot && r.lotNo && `Lot ${r.lotNo}`,
                features.expiry && selectedItem?.tracksExpiry && r.expiryDate && `Exp ${new Date(r.expiryDate).toLocaleDateString()}`
            ].filter(Boolean).join(" / ") || "-"}</span>
        } as Column<StockLedgerEntry>] : []),
    ];

    const columns: Column<StockReportRow>[] = [
        {
            key: "name", header: "Item / SKU", width: 260, cell: (r) => (
                <div className="flex flex-col">
                    <Link href={`/reports/stock-ledger?itemId=${r.id}`} className="font-bold text-foreground hover:text-primary hover:underline">{r.name}</Link>
                    {r.sku && <span className="text-[10px] text-muted-foreground uppercase">{r.sku}</span>}
                </div>
            )
        },
        { key: "unit", header: "Unit", width: 100, cell: (r) => <span className="text-xs uppercase font-medium">{r.unit ?? "-"}</span> },
        {
            key: "trackingPolicy",
            header: "Stock Tracking",
            width: 140,
            cell: (r) => <PolicyBadge enabled={r.type === "goods" && r.trackInventory !== false} label="Tracked" offLabel="Not tracked" />
        },
        ...(features.serial ? [{
            key: "serialPolicy",
            header: "Serial Numbers",
            width: 140,
            cell: (r) => <PolicyBadge enabled={Boolean(r.isSerialized)} label="Required" />
        } as Column<StockReportRow>] : []),
        ...(features.batch ? [{
            key: "batchPolicy",
            header: "Batch Number",
            width: 140,
            cell: (r) => <PolicyBadge enabled={Boolean(r.tracksBatch)} label="Required" />
        } as Column<StockReportRow>] : []),
        ...(features.lot ? [{
            key: "lotPolicy",
            header: "Lot Number",
            width: 130,
            cell: (r) => <PolicyBadge enabled={Boolean(r.tracksLot)} label="Required" />
        } as Column<StockReportRow>] : []),
        ...(features.expiry ? [{
            key: "expiryPolicy",
            header: "Expiry Date",
            width: 130,
            cell: (r) => <PolicyBadge enabled={Boolean(r.tracksExpiry)} label="Required" />
        } as Column<StockReportRow>] : []),
        {
            key: "opening",
            header: <span className="w-full block text-right">Opening</span>,
            align: "right", width: 120,
            cell: (r) => <div className="text-right tabular-nums">{r.openingQty}</div>
        },
        {
            key: "in",
            header: <span className="w-full block text-right text-emerald-600">Inward</span>,
            align: "right", width: 120,
            cell: (r) => (
                <div className="flex items-center justify-end gap-1 text-emerald-600 font-medium tabular-nums">
                    <ArrowDown className="h-3 w-3" /> {r.purchaseQty}
                </div>
            )
        },
        {
            key: "out",
            header: <span className="w-full block text-right text-red-600">Outward</span>,
            align: "right", width: 120,
            cell: (r) => (
                <div className="flex items-center justify-end gap-1 text-red-600 font-medium tabular-nums">
                    <ArrowUp className="h-3 w-3" /> {r.saleQty}
                </div>
            )
        },
        {
            key: "closing",
            header: <span className="w-full block text-right font-black">Closing Qty</span>,
            align: "right", width: 140,
            cell: (r) => <div className="text-right font-black tabular-nums">{r.closingQty}</div>
        },
        {
            key: "value",
            header: <span className="w-full block text-right">Value</span>,
            align: "right", width: 160,
            cell: (r) => (
                <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                    <MoneyText value={r.closingAmt} className="font-bold" />
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6 pb-20 text-foreground">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
                <PageHeader title="Stock Ledger" description="Real-time movement and valuation of inventory items." />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={run} disabled={loading} className="rounded-xl h-10"><RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh</Button>
                    <Button size="sm" className="rounded-xl h-10 shadow-lg shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-700 text-white border-none"><FileDown className="mr-2 h-4 w-4" /> Export Report</Button>
                </div>
            </div>

            {inventorySettings && !features.inventory ? (
                <Card className="border-dashed border-border/70">
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                        Enable Inventory Tracking in Configuration to use the Stock Ledger.
                    </CardContent>
                </Card>
            ) : (
                <>
            <ReportFilterBar
                className="print:hidden"
                searchValue={searchQuery}
                onSearch={setSearchQuery}
                searchPlaceholder={selectedItemId ? "Search source, warehouse, batch..." : "Search item or SKU..."}
                dateRange={dateRange}
                onDateRangeChange={(range, dates) => {
                    setDateRange(range);
                    setFrom(dates.from);
                    setTo(dates.to);
                }}
                fields={stockLedgerFilterFields}
                onRun={run}
            />

            {selectedItemId && itemLedger ? (
                <>
                    <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selected Item</p>
                            <h2 className="mt-1 text-2xl font-black">{itemLedger.item?.name || "Selected Stock"}</h2>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-lg border border-border bg-background px-2.5 py-1 font-semibold">SKU: {itemLedger.item?.sku || "-"}</span>
                                <span className="rounded-lg border border-border bg-background px-2.5 py-1 font-semibold">Unit: {itemLedger.item?.unit || "-"}</span>
                                <span className="rounded-lg border border-border bg-background px-2.5 py-1 font-semibold">Group: {itemLedger.item?.group || "-"}</span>
                            </div>
                        </div>
                        <Link href="/reports/stock-ledger">
                            <Button variant="outline" size="sm" className="rounded-xl">Back to all stock</Button>
                        </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
                        <Card className="border-border/50 shadow-none"><CardContent className="pt-5"><div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Opening Quantity</div><div className="mt-2 text-2xl font-black tabular-nums">{itemLedger.openingQty ?? 0}</div><MoneyText value={itemLedger.openingAmt ?? 0} className="text-xs text-muted-foreground" /></CardContent></Card>
                        <Card className="border-border/50 shadow-none"><CardContent className="pt-5"><div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Debit / Inward</div><div className="mt-2 text-2xl font-black tabular-nums">{itemLedger.debitQty ?? 0}</div><MoneyText value={itemLedger.debitAmt ?? 0} className="text-xs text-emerald-600" /></CardContent></Card>
                        <Card className="border-border/50 shadow-none"><CardContent className="pt-5"><div className="text-[10px] uppercase font-bold tracking-widest text-red-600">Credit / Outward</div><div className="mt-2 text-2xl font-black tabular-nums">{itemLedger.creditQty ?? 0}</div><MoneyText value={itemLedger.creditAmt ?? 0} className="text-xs text-red-600" /></CardContent></Card>
                        <Card className="border-border/50 bg-emerald-600/5 shadow-none"><CardContent className="pt-5"><div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Closing Quantity</div><div className="mt-2 text-2xl font-black tabular-nums">{itemLedger.closingQty ?? 0}</div><MoneyText value={itemLedger.closingAmt ?? 0} className="text-xs font-semibold" /></CardContent></Card>
                    </div>
                    <Card className="border-border/50 glass-card overflow-hidden shadow-xl min-h-[400px]">
                        <DataTable
                            rows={filteredItemLedgerEntries}
                            columns={itemLedgerColumns}
                            loading={loading}
                            emptyText="No stock movements found"
                            className="border-none"
                            onRowClick={(row) => {
                                const href = getVoucherHref(row.voucherId);
                                if (href) router.push(href);
                            }}
                        />
                    </Card>
                </>
            ) : (
                <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
                <Card className="border-border/50 bg-emerald-600/5 shadow-none overflow-hidden text-foreground">
                    <CardContent className="pt-6">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 flex items-center gap-2">
                            <Package className="h-3 w-3" /> Total Inventory Value
                        </div>
                        <div className="mt-2 text-2xl font-black"><MoneyText value={totalValue} /></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 glass-card overflow-hidden shadow-xl min-h-[400px]">
                <DataTable
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    emptyText="No stock data found"
                    className="border-none"
                    onRowClick={(row) => router.push(`/reports/stock-ledger?itemId=${row.id}`)}
                />
            </Card>
                </>
            )}
                </>
            )}
        </div>
    );
}

export default function StockLedgerPage() {
    return (
        <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading stock ledger...</div>}>
            <StockLedgerPageContent />
        </React.Suspense>
    );
}
