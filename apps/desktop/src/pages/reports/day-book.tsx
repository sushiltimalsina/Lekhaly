// apps/desktop/src/pages/reports/day-book.tsx
import * as React from "react";
import { 
    Printer, 
    RefreshCw, 
    AlertCircle, 
    Clock, 
    ChevronLeft,
    Calendar,
    ArrowUpDown,
    Hash,
    MoreHorizontal
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import StatusBadge, { type DocStatus } from "@/components/app/status-badge";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { listVouchers, type VoucherRecord } from "@/lib/api/vouchers";
import { getDateDisplay } from "@/lib/dates/display";
import { getSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

export default function DayBookReportPage() {
    const navigate = useNavigate();
    const settings = getSettings();
    const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<VoucherRecord[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState({
        from: new Date(),
        to: new Date(),
        q: ""
    });

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listVouchers({
                from: filters.from.toISOString(),
                to: filters.to.toISOString(),
                q: filters.q || undefined,
                take: 1000
            });
            setData(Array.isArray(res) ? res : (res as any)?.rows || []);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load day book");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { load(); }, [filters]);

    const stats = React.useMemo(() => {
        const total = data.reduce((s, r) => s + (r.amount || 0), 0);
        const types = data.reduce((acc: any, r) => {
            acc[r.voucherType] = (acc[r.voucherType] || 0) + 1;
            return acc;
        }, {});
        return { total, count: data.length, types };
    }, [data]);

    const columns = [
        {
            key: "date",
            header: "Time Registry",
            cell: (r: VoucherRecord) => {
                const d = getDateDisplay({ ad: r.voucherDate, bs: r.voucherDateBs, format: calendarFmt });
                return (
                    <div className="flex flex-col">
                         <span className="font-bold text-slate-700 tabular-nums">{d.primary}</span>
                         <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{d.secondary}</span>
                    </div>
                );
            }
        },
        { key: "voucherNo", header: "Registry No", cell: (r: VoucherRecord) => <span className="font-black text-slate-800 tabular-nums uppercase text-[11px] tracking-widest">{r.voucherNo}</span> },
        { 
            key: "type", 
            header: "Class", 
            cell: (r: VoucherRecord) => (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 shadow-sm">
                    {r.voucherType.replace(/_/g, " ")}
                </span>
            ) 
        },
        { key: "memo", header: "Narration / Registry Detail", cell: (r: VoucherRecord) => <span className="text-slate-500 font-medium line-clamp-1 italic text-xs max-w-sm">{r.memo || "—"}</span> },
        { key: "status", header: "State", cell: (r: VoucherRecord) => <StatusBadge status={r.status as DocStatus} /> },
        { key: "amount", header: "Registry Valuation", align: "right" as const, cell: (r: VoucherRecord) => (
            <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-black text-slate-900 shadow-sm tabular-nums">
                <MoneyText value={r.amount} />
            </div>
        )}
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-2">
                        <ChevronLeft className="h-3.5 w-3.5" /> Intelligence Center
                    </button>
                    <PageHeader title="Day Book" description="Comprehensive chronological registry of every transactional event." />
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={load} disabled={loading} className="h-11 rounded-2xl font-black text-xs uppercase tracking-widest px-6 border-slate-100 shadow-sm border-2">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-2xl font-black text-xs uppercase tracking-widest px-6 border-slate-100 shadow-sm border-2">
                        <Printer className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="bg-white p-6 rounded-[32px] border-2 border-slate-50 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Total Periodic Valuation</span>
                    <div className="text-2xl font-black text-slate-900 tabular-nums italic"><MoneyText value={stats.total} /></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border-2 border-slate-50 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Document Count</span>
                    <div className="text-2xl font-black text-slate-900 tabular-nums italic">{stats.count} <span className="text-[10px] text-slate-300">Total</span></div>
                </div>
                <div className="md:col-span-2 bg-slate-900 p-6 rounded-[32px] flex items-center justify-between shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Clock className="h-20 w-20 text-indigo-400" /></div>
                    <div className="space-y-1 relative z-10">
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block italic">Temporal Audit Registry</span>
                         <h3 className="text-lg font-black text-white italic">Chronological System Integrity Log</h3>
                    </div>
                </div>
            </div>

            <AdvancedFilterBar 
                onSearch={(q) => setFilters(f => ({ ...f, q }))}
                onFilterChange={f => setFilters(prev => ({ ...prev, from: f.dateRange?.from || new Date(), to: f.dateRange?.to || new Date() }))}
                defaultRange="today"
            />

            {error && (
                <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-700 font-black text-xs uppercase tracking-widest flex items-center gap-4 text-rose-600">
                    <AlertCircle className="h-6 w-6" /> {error}
                </div>
            )}

            <Card className="rounded-[42px] border-2 border-slate-50 shadow-2xl overflow-hidden bg-white border-none">
                 <div className="hidden print:flex flex-col items-center p-12 border-b-4 border-slate-950 bg-white">
                    <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic">Lekhaly System Day Book</h1>
                    <div className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Audit Windows: {filters.from.toLocaleDateString()} — {filters.to.toLocaleDateString()}</div>
                </div>
                <DataTable columns={columns} rows={data} loading={loading} className="border-none" />
                <div className="p-10 bg-slate-50 border-t-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex flex-wrap gap-4">
                         {Object.entries(stats.types).map(([type, count]: any) => (
                             <div key={type} className="px-5 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{type.replace(/_/g, " ")}</span>
                                 <span className="text-xs font-black text-slate-900 tabular-nums">{count}</span>
                             </div>
                         ))}
                     </div>
                     <div className="text-right space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-4">Consolidated Daily Mass</span>
                         <div className="bg-slate-950 text-white rounded-[24px] p-6 flex items-center gap-12 shadow-2xl relative overflow-hidden group">
                             <div className="flex flex-col items-end relative z-10">
                                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Total Valuation</span>
                                 <div className="text-3xl font-black tabular-nums italic"><MoneyText value={stats.total} /></div>
                             </div>
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Clock className="h-16 w-16" /></div>
                         </div>
                     </div>
                </div>
            </Card>
        </div>
    );
}
