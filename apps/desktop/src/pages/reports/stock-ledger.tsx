"use client";

import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getInventorySettings, getItemStockLedger, getStockReport, StockReportRow, type InventorySettings, type StockLedgerEntry } from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { RefreshCw, Package, ArrowUp, ArrowDown, FileDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

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

export default function StockLedgerPage() {
    const [searchParams] = useSearchParams();
    const selectedItemId = searchParams.get("itemId");
    const initialRange = getDateRange("this_year");
    const [from, setFrom] = React.useState<Date | null>(initialRange.from);
    const [to, setTo] = React.useState<Date | null>(initialRange.to);
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<StockReportRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
    const [itemLedger, setItemLedger] = React.useState<{
        itemId: string;
        item?: { id: string; name: string; sku?: string | null; unit?: string | null; group?: string | null };
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
    const itemLedgerColumns: Column<StockLedgerEntry>[] = [
        { key: "date", header: "Date", width: 130, cell: (r) => <div className="text-xs font-medium">{new Date(r.date).toLocaleDateString()}</div> },
        {
            key: "voucher",
            header: "Source",
            width: 170,
            cell: (r) => r.voucherId ? (
                <Link to={`/vouchers/view/${r.voucherId}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                    {r.voucherNumber || r.voucherType || "Voucher"}
                    <ExternalLink className="h-3 w-3" />
                </Link>
            ) : <span className="text-muted-foreground">Opening / manual</span>
        },
        { key: "location", header: "Location", width: 180, cell: (r) => <span className="text-xs">{[r.warehouseName, r.binName].filter(Boolean).join(" / ") || "-"}</span> },
        { key: "debitQty", header: <span className="block text-right text-emerald-600">Debit Qty</span>, align: "right", width: 110, cell: (r) => <span className="tabular-nums text-emerald-600">{r.qtyIn || "-"}</span> },
        { key: "debitAmt", header: <span className="block text-right text-emerald-600">Debit Amount</span>, align: "right", width: 150, cell: (r) => <MoneyText value={r.debitAmt ?? 0} className="text-emerald-600 font-semibold" /> },
        { key: "creditQty", header: <span className="block text-right text-red-600">Credit Qty</span>, align: "right", width: 110, cell: (r) => <span className="tabular-nums text-red-600">{r.qtyOut || "-"}</span> },
        { key: "creditAmt", header: <span className="block text-right text-red-600">Credit Amount</span>, align: "right", width: 150, cell: (r) => <MoneyText value={r.creditAmt ?? 0} className="text-red-600 font-semibold" /> },
        { key: "closingQty", header: <span className="block text-right">Closing Qty</span>, align: "right", width: 120, cell: (r) => <span className="font-black tabular-nums">{r.runningQty ?? 0}</span> },
        { key: "closingAmt", header: <span className="block text-right">Closing Amount</span>, align: "right", width: 150, cell: (r) => <MoneyText value={r.runningAmt ?? 0} className="font-bold" /> },
        ...(features.batch || features.lot || features.expiry ? [{
            key: "tracking",
            header: "Tracking",
            width: 220,
            cell: (r: StockLedgerEntry) => <span className="text-xs text-muted-foreground">{[
                features.batch && r.batchNo && `Batch ${r.batchNo}`,
                features.lot && r.lotNo && `Lot ${r.lotNo}`,
                features.expiry && r.expiryDate && `Exp ${new Date(r.expiryDate).toLocaleDateString()}`
            ].filter(Boolean).join(" / ") || "-"}</span>
        } as Column<StockLedgerEntry>] : []),
    ];

    const columns: Column<StockReportRow>[] = [
        {
            key: "name", header: "Item / SKU", width: 260, cell: (r) => (
                <div className="flex flex-col">
                    <Link to={`/reports/stock-ledger?itemId=${r.id}`} className="font-bold text-foreground hover:text-primary hover:underline">{r.name}</Link>
                    {r.sku && <span className="text-[10px] text-muted-foreground uppercase">{r.sku}</span>}
                </div>
            )
        },
        { key: "unit", header: "Unit", width: 100, cell: (r) => <span className="text-xs uppercase font-medium">{r.unit ?? "—"}</span> },
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
            <AdvancedFilterBar className="print:hidden" onSearch={setSearchQuery} onFilterChange={(f) => {
                if (f.dateRange) { setFrom(f.dateRange.from); setTo(f.dateRange.to); }
            }} defaultRange="this_year" />

            {selectedItemId && itemLedger ? (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black">{itemLedger.item?.name || "Selected Stock"}</h2>
                            <p className="text-xs text-muted-foreground">{[itemLedger.item?.sku, itemLedger.item?.group, itemLedger.item?.unit].filter(Boolean).join(" / ")}</p>
                        </div>
                        <Link to="/reports/stock-ledger">
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
                        <DataTable rows={itemLedger.entries} columns={itemLedgerColumns} loading={loading} emptyText="No stock movements found" className="border-none" />
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
                <DataTable rows={rows} columns={columns} loading={loading} emptyText="No stock data found" className="border-none" />
            </Card>
                </>
            )}
                </>
            )}
        </div>
    );
}
