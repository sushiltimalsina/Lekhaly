"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import { getInventorySettings, getStockReport, StockReportRow, type InventorySettings } from "@/lib/api/inventory";
import { inventoryFeatures } from "@/lib/inventory-features";
import { Card, CardContent } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Printer, RefreshCw, AlertCircle, Package, ArrowUp, ArrowDown, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange } from "@/lib/dates/ranges";

export default function StockLedgerPage() {
    const initialRange = getDateRange("this_year");
    const [from, setFrom] = React.useState<Date | null>(initialRange.from);
    const [to, setTo] = React.useState<Date | null>(initialRange.to);
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<StockReportRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);

    async function run() {
        setLoading(true);
        setError(null);
        try {
            const [res, settings] = await Promise.all([
                getStockReport({
                    from: from?.toISOString(),
                    to: to?.toISOString()
                }),
                getInventorySettings()
            ]);
            setInventorySettings(settings);

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
    }, [from, to, searchQuery]);

    const totalValue = rows.reduce((acc, r) => acc + (r.closingAmt ?? 0), 0);
    const features = inventoryFeatures(inventorySettings);

    const columns: Column<StockReportRow>[] = [
        {
            key: "name", header: "Item Name", cell: (r) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{r.name}</span>
                    {r.sku && <span className="text-[10px] text-muted-foreground uppercase">{r.sku}</span>}
                </div>
            )
        },
        { key: "unit", header: "Unit", width: 100, cell: (r) => <span className="text-xs uppercase font-medium">{r.unit ?? "â€”"}</span> },
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
        </div>
    );
}

