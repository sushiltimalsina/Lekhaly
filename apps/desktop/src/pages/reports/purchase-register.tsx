// apps/desktop/src/pages/reports/purchase-register.tsx
import * as React from "react";
import { 
    Printer, 
    FileDown, 
    RefreshCw, 
    AlertCircle, 
    TrendingDown, 
    ShoppingCart,
    ChevronLeft,
    Truck,
    Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { Card, CardContent } from "@lekhaly/ui";
import DataTable from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import StatusBadge, { type DocStatus } from "@/components/app/status-badge";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { listVouchers, type VoucherRecord } from "@/lib/api/vouchers";
import { getDateDisplay } from "@/lib/dates/display";
import { getSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

export default function PurchaseRegisterReportPage() {
    const navigate = useNavigate();
    const settings = getSettings();
    const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<VoucherRecord[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState({
        from: null as Date | null,
        to: null as Date | null,
        q: ""
    });

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listVouchers({
                type: "purchase",
                from: filters.from?.toISOString() || undefined,
                to: filters.to?.toISOString() || undefined,
                q: filters.q || undefined,
                take: 1000
            });
            setData(Array.isArray(res) ? res : (res as any)?.rows || []);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load purchase registry");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { load(); }, [filters]);

    const totalOutflux = data.reduce((s, r) => s + (r.amount || 0), 0);
    const purchaseCount = data.length;

    const columns = [
        {
            key: "date",
            header: "Date",
            cell: (r: VoucherRecord) => {
                const d = getDateDisplay({ ad: r.voucherDate, bs: r.voucherDateBs, format: calendarFmt });
                return (
                    <div className="flex flex-col">
                         <span className="font-bold text-slate-700">{d.primary}</span>
                         <span className="text-[10px] text-slate-400 font-medium">{d.secondary}</span>
                    </div>
                );
            }
        },
        { key: "voucherNo", header: "Bill / Entry No", cell: (r: VoucherRecord) => <span className="font-black text-slate-800 tabular-nums uppercase text-[11px] tracking-widest">{r.voucherNo}</span> },
        { key: "memo", header: "Supplier / Registry Detail", cell: (r: VoucherRecord) => <span className="text-slate-500 font-medium line-clamp-1 italic text-xs">{r.memo || "—"}</span> },
        { key: "status", header: "Status", cell: (r: VoucherRecord) => <StatusBadge status={r.status as DocStatus} /> },
        { key: "amount", header: "Net Bill Value", align: "right" as const, cell: (r: VoucherRecord) => (
            <div className="bg-orange-50/50 px-3 py-1 rounded-lg border border-orange-100">
                <MoneyText value={r.amount} className="font-black text-orange-700 tabular-nums shadow-sm" />
            </div>
        )}
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-widest mb-2">
                        <ChevronLeft className="h-3.5 w-3.5" /> Intelligence Center
                    </button>
                    <PageHeader title="Purchase Register" description="Consolidated audit of all procurement bills and stock inward transactions." />
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={load} disabled={loading} className="h-11 rounded-2xl font-black text-xs uppercase tracking-widest px-6 border-slate-100 shadow-sm border-2">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh Audit
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-2xl font-black text-xs uppercase tracking-widest px-6 border-slate-100 shadow-sm border-2">
                        <Printer className="mr-2 h-4 w-4" /> Print Document
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[30px] border-2 border-slate-50 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Procurement Outflux</span>
                             <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums italic"><MoneyText value={totalOutflux} /></div>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-xl shadow-orange-100 border border-orange-100">
                            <TrendingDown className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[30px] border-2 border-slate-50 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inward Volume</span>
                             <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums italic">{purchaseCount} <span className="text-[10px] text-slate-300">Bills</span></div>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-xl shadow-slate-100 border border-slate-100">
                            <Truck className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AdvancedFilterBar 
                onSearch={(q) => setFilters(f => ({ ...f, q }))}
                onFilterChange={f => setFilters(prev => ({ ...prev, from: f.dateRange?.from || null, to: f.dateRange?.to || null }))}
                defaultRange="this_year"
            />

            {error && (
                <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-700 font-black text-xs uppercase tracking-widest flex items-center gap-4 text-rose-600 italic">
                    <AlertCircle className="h-6 w-6" /> {error}
                </div>
            )}

            <Card className="rounded-[42px] border-2 border-slate-50 shadow-2xl overflow-hidden bg-white border-none">
                <div className="hidden print:flex flex-col items-center p-12 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Purchase Registry</h1>
                    <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                        <span>Period: {filters.from?.toLocaleDateString()} — {filters.to?.toLocaleDateString()}</span>
                        <span>Consolidated Registry: Procurement Analysis</span>
                    </div>
                </div>
                <DataTable columns={columns} rows={data} loading={loading} className="border-none" />
                {data.length > 0 && (
                    <div className="p-10 bg-slate-950 text-white flex items-center justify-between border-none overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4"><Truck className="h-32 w-32 text-orange-500" /></div>
                         <div className="space-y-1 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Total Registered Outflux</span>
                            <div className="text-4xl font-black tracking-tighter tabular-nums italic"><MoneyText value={totalOutflux} /></div>
                         </div>
                         <div className="flex items-center gap-3 relative z-10">
                             <div className="h-14 px-6 rounded-2xl bg-orange-600 flex flex-col justify-center items-end shadow-xl shadow-orange-500/20">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-orange-200 opacity-60">Avg Bill Magnitude</span>
                                 <div className="text-xl font-black tabular-nums italic"><MoneyText value={totalOutflux / purchaseCount} /></div>
                             </div>
                         </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

