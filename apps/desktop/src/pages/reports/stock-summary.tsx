// apps/desktop/src/pages/reports/stock-summary.tsx
import * as React from "react";
import { 
    Printer, 
    RefreshCw, 
    AlertCircle, 
    ShoppingBag, 
    ChevronLeft,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    Layers,
    Tag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { Card, CardContent } from "@lekhaly/ui";
import DataTable from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getStockSummary } from "@/lib/api/reports";
import { cn } from "@/lib/utils";

type StockRow = {
    id: string;
    name: string;
    sku: string;
    unit: string;
    type: string;
    parentGroup: string;
    openingQty: number;
    openingAmt: number;
    purchaseQty: number;
    purchaseAmt: number;
    saleQty: number;
    saleAmt: number;
    closingQty: number;
    closingAmt: number;
    closingPrice: number;
};

export default function StockSummaryReportPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<StockRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState({ from: null as Date | null, to: null as Date | null });

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getStockSummary({
                from: filters.from?.toISOString() || undefined,
                to: filters.to?.toISOString() || undefined
            });
            setData(Array.isArray(res) ? res : (res as any)?.rows || []);
        } catch (e: any) {
            setError(e?.message ?? "Failed to fetch stock summary");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { load(); }, [filters]);

    const stats = React.useMemo(() => {
        return data.reduce((acc, r) => ({
            totalItems: acc.totalItems + 1,
            totalValuation: acc.totalValuation + r.closingAmt,
            totalOutQty: acc.totalOutQty + r.saleQty,
            totalInQty: acc.totalInQty + r.purchaseQty,
        }), { totalItems: 0, totalValuation: 0, totalOutQty: 0, totalInQty: 0 });
    }, [data]);

    const columns = [
        {
            key: "item",
            header: "Product Registry",
            cell: (r: StockRow) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{r.name}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.sku || "NO-SKU"}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{r.parentGroup}</span>
                    </div>
                </div>
            )
        },
        { 
            key: "opening", 
            header: "Opening Stock", 
            align: "right" as const, 
            cell: (r: StockRow) => (
                <div className="flex flex-col items-end">
                    <span className="font-bold text-slate-600 tabular-nums">{r.openingQty} {r.unit}</span>
                    <span className="text-[9px] text-slate-400 font-medium italic"><MoneyText value={r.openingAmt} /></span>
                </div>
            ) 
        },
        { 
            key: "inward", 
            header: "Stock Inward (+)", 
            align: "right" as const, 
            cell: (r: StockRow) => (
                <div className="flex flex-col items-end bg-emerald-50/50 p-1 px-2 rounded-lg">
                    <span className="font-bold text-emerald-700 tabular-nums">+{r.purchaseQty}</span>
                    <span className="text-[9px] text-emerald-400 font-medium italic"><MoneyText value={r.purchaseAmt} /></span>
                </div>
            ) 
        },
        { 
            key: "outward", 
            header: "Stock Outward (-)", 
            align: "right" as const, 
            cell: (r: StockRow) => (
                <div className="flex flex-col items-end bg-rose-50/50 p-1 px-2 rounded-lg">
                    <span className="font-bold text-rose-700 tabular-nums">-{r.saleQty}</span>
                    <span className="text-[9px] text-rose-400 font-medium italic"><MoneyText value={r.saleAmt} /></span>
                </div>
            ) 
        },
        { 
            key: "closing", 
            header: "Available Inventory", 
            align: "right" as const, 
            cell: (r: StockRow) => (
                <div className="flex flex-col items-end bg-slate-900 p-2 rounded-xl text-white shadow-lg">
                    <span className="font-black tabular-nums">{r.closingQty} {r.unit}</span>
                    <span className="text-[10px] text-slate-400 font-black italic tracking-tighter"><MoneyText value={r.closingAmt} /></span>
                </div>
            ) 
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-2 font-black italic">
                        <ChevronLeft className="h-3.5 w-3.5" /> Intelligence Center
                    </button>
                    <PageHeader title="Stock Summary Audit" description="Comprehensive multi-period inventory valuation and stock movement telemetry." />
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={load} disabled={loading} className="h-11 rounded-2xl border-slate-100 font-black text-xs uppercase tracking-widest px-6 shadow-sm">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Re-Sync Stock
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-2xl border-slate-100 font-black text-xs uppercase tracking-widest px-6 shadow-sm">
                        <Printer className="mr-2 h-4 w-4" /> Print Ledger
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-[32px] border-2 border-slate-50 shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Inventory Valuation</span>
                             <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><ShoppingBag className="h-5 w-5" /></div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums italic"><MoneyText value={stats.totalValuation} /></div>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">Aggregate closing asset value</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[32px] border-2 border-slate-50 shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 italic">Inward Volume</span>
                             <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp className="h-5 w-5" /></div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums italic">{stats.totalInQty} Units</div>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">Total procurement / production</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[32px] border-2 border-slate-50 shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 italic">Outward Outflux</span>
                             <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center"><TrendingDown className="h-5 w-5" /></div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums italic">{stats.totalOutQty} Units</div>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">Total sales / consumption</p>
                    </CardContent>
                </Card>
                <div className="bg-slate-950 p-6 rounded-[32px] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                     <div className="flex justify-between items-start relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic font-black">Audit Integrity</span>
                        <div className="h-10 w-10 rounded-2xl bg-white/10 text-white flex items-center justify-center"><Layers className="h-5 w-5" /></div>
                     </div>
                     <div className="relative z-10">
                        <div className="text-2xl font-black text-white italic tracking-tighter uppercase">{stats.totalItems} Active Units</div>
                        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-1">Monitored SKU Registry</p>
                     </div>
                     <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"><Layers className="h-32 w-32" /></div>
                </div>
            </div>

            <AdvancedFilterBar 
                onFilterChange={f => setFilters({ from: f.dateRange?.from || null, to: f.dateRange?.to || null })}
                defaultRange="this_year"
            />

            {error && (
                <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-700 font-black text-xs uppercase tracking-widest flex items-center gap-4 text-rose-600 animate-shake">
                    <AlertCircle className="h-6 w-6" /> {error}
                </div>
            )}

            <Card className="rounded-[42px] border-2 border-slate-50 shadow-2xl overflow-hidden bg-white border-none min-h-[500px]">
                <div className="hidden print:flex flex-col items-center p-12 border-b-8 border-slate-900 bg-white">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Stock Ledger Summary</h1>
                    <div className="mt-4 flex gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">
                        <span>Audit Horizon: {filters.from?.toLocaleDateString()} — {filters.to?.toLocaleDateString()}</span>
                        <span>Registry State: Synchronized</span>
                    </div>
                </div>
                <DataTable columns={columns} rows={data} loading={loading} className="border-none" />
                <div className="p-12 bg-slate-900 text-white flex flex-col lg:flex-row items-center justify-between gap-12 rounded-b-[42px]">
                     <div className="flex flex-wrap gap-12 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 shrink-0">
                        <div className="space-y-2"><span>Inward (Qty)</span><div className="text-2xl text-white tracking-widest tabular-nums italic">+{stats.totalInQty}</div></div>
                        <div className="space-y-2"><span>Outward (Qty)</span><div className="text-2xl text-white tracking-widest tabular-nums italic">-{stats.totalOutQty}</div></div>
                     </div>
                     <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-4 px-8 py-4 bg-white/5 rounded-3xl border border-white/10 italic">
                            <Tag className="h-4 w-4 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Inventory Liquidity & Valuation Integrity Audited</span>
                        </div>
                     </div>
                     <div className="bg-indigo-600 p-8 rounded-[36px] shadow-2xl whitespace-nowrap text-right min-w-[300px] border border-indigo-400/20">
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 block mb-2 italic">Net Closing Inventory Valuation</span>
                         <div className="text-4xl font-black tabular-nums tracking-tighter italic"><MoneyText value={stats.totalValuation} /></div>
                     </div>
                </div>
            </Card>
        </div>
    );
}
