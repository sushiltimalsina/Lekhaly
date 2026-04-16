// apps/desktop/src/pages/reports/party-aging.tsx
import * as React from "react";
import { 
    Printer, 
    RefreshCw, 
    AlertCircle, 
    Clock, 
    ChevronLeft,
    Filter,
    ArrowUpDown,
    CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { Card, CardContent } from "@lekhaly/ui";
import DataTable from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getPartyAging } from "@/lib/api/reports";
import { getSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

type AgingBucket = {
    partyName: string;
    total: number;
    b1: number; // 0-30
    b2: number; // 31-60
    b3: number; // 61-90
    b4: number; // 90+
};

export default function PartyAgingReportPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<AgingBucket[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [type, setType] = React.useState<"receivable" | "payable">("receivable");

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getPartyAging({ type });
            setData(Array.isArray(res) ? res : (res as any)?.rows || []);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load aging report");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { load(); }, [type]);

    const totals = React.useMemo(() => {
        return data.reduce((acc, r) => ({
            total: acc.total + r.total,
            b1: acc.b1 + r.b1,
            b2: acc.b2 + r.b2,
            b3: acc.b3 + r.b3,
            b4: acc.b4 + r.b4,
        }), { total: 0, b1: 0, b2: 0, b3: 0, b4: 0 });
    }, [data]);

    const columns = [
        {
            key: "party",
            header: "Entity Registry",
            cell: (r: AgingBucket) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{r.partyName}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{type === "receivable" ? "Debtor" : "Creditor"}</span>
                </div>
            )
        },
        { key: "total", header: "Grand Total", align: "right" as const, cell: (r: AgingBucket) => <MoneyText value={r.total} className="font-black text-slate-900" /> },
        { key: "b1", header: "0 – 30 Days", align: "right" as const, cell: (r: AgingBucket) => <MoneyText value={r.b1} className={cn("font-medium", r.b1 > 0 ? "text-indigo-600" : "text-slate-200")} /> },
        { key: "b2", header: "31 – 60 Days", align: "right" as const, cell: (r: AgingBucket) => <MoneyText value={r.b2} className={cn("font-medium", r.b2 > 0 ? "text-blue-600" : "text-slate-200")} /> },
        { key: "b3", header: "61 – 90 Days", align: "right" as const, cell: (r: AgingBucket) => <MoneyText value={r.b3} className={cn("font-medium", r.b3 > 0 ? "text-amber-600" : "text-slate-200")} /> },
        { key: "b4", header: "90+ Days", align: "right" as const, cell: (r: AgingBucket) => <MoneyText value={r.b4} className={cn("font-bold text-rose-600", r.b4 === 0 && "text-slate-200")} /> }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-2">
                        <ChevronLeft className="h-3.5 w-3.5" /> Intelligence Center
                    </button>
                    <PageHeader title="Party Aging Analysis" description="Strategic breakdown of outstanding credit by temporal maturity buckets." />
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-2xl flex gap-1">
                        <Button variant={type === "receivable" ? "default" : "ghost"} onClick={() => setType("receivable")} className={cn("h-9 rounded-xl font-black text-[9px] uppercase tracking-widest px-6", type === "receivable" ? "bg-white text-slate-900 shadow-sm border-none" : "text-slate-400")}>Receivables</Button>
                        <Button variant={type === "payable" ? "default" : "ghost"} onClick={() => setType("payable")} className={cn("h-9 rounded-xl font-black text-[9px] uppercase tracking-widest px-6", type === "payable" ? "bg-white text-slate-900 shadow-sm border-none" : "text-slate-400")}>Payables</Button>
                    </div>
                    <Button variant="outline" onClick={load} disabled={loading} className="h-12 rounded-2xl font-black text-xs uppercase tracking-widest px-6 border-slate-100 shadow-sm">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="h-12 rounded-2xl font-black text-xs uppercase tracking-widest px-6 border-slate-100 shadow-sm">
                        <Printer className="mr-2 h-4 w-4" /> Export Audit
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-[32px] border-2 border-slate-50 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Exposure</span>
                        <div className="text-2xl font-black text-slate-900 tabular-nums italic"><MoneyText value={totals.total} /></div>
                    </CardContent>
                </Card>
                <Card className="rounded-[32px] border-2 border-slate-50 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">High Risk (90+)</span>
                        <div className="text-2xl font-black text-rose-600 tabular-nums italic"><MoneyText value={totals.b4} /></div>
                    </CardContent>
                </Card>
                <div className="md:col-span-2 bg-indigo-600 p-6 rounded-[32px] flex items-center justify-between shadow-2xl shadow-indigo-100">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.3em] block italic">Temporal Maturity Distribution</span>
                        <div className="text-lg font-black text-white italic tracking-tighter uppercase whitespace-pre-wrap leading-tight">Liquidity Risk & Credit Registry Audit</div>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white"><Clock className="h-7 w-7" /></div>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-700 font-black text-xs uppercase tracking-widest flex items-center gap-4 text-rose-600">
                    <AlertCircle className="h-6 w-6" /> {error}
                </div>
            )}

            <Card className="rounded-[42px] border-2 border-slate-50 shadow-2xl overflow-hidden bg-white border-none">
                <div className="hidden print:flex flex-col items-center p-12 border-b-4 border-slate-950 bg-white">
                    <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic">Institutional Credit Aging Audit</h1>
                    <div className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic font-medium uppercase">Perspective: {type.toUpperCase()} / {new Date().toLocaleDateString()}</div>
                </div>
                <DataTable columns={columns} rows={data} loading={loading} className="border-none" />
                <div className="p-10 bg-slate-50 border-t-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12">
                     <div className="flex flex-wrap gap-8 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">
                        <div className="space-y-2"><span>0–30 Total</span><div className="text-xl text-slate-900 tabular-nums italic"><MoneyText value={totals.b1} /></div></div>
                        <div className="space-y-2"><span>31–60 Total</span><div className="text-xl text-slate-900 tabular-nums italic"><MoneyText value={totals.b2} /></div></div>
                        <div className="space-y-2"><span>61–90 Total</span><div className="text-xl text-slate-900 tabular-nums italic"><MoneyText value={totals.b3} /></div></div>
                     </div>
                     <div className="bg-slate-950 text-white rounded-[24px] p-6 flex items-center gap-12 shadow-2xl overflow-hidden relative group">
                         <div className="flex flex-col items-end relative z-10 transition-transform group-hover:-translate-x-2">
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Authenticated Exposure</span>
                             <div className="text-4xl font-black tabular-nums italic whitespace-nowrap"><MoneyText value={totals.total} /></div>
                         </div>
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><CheckCircle2 className="h-20 w-20" /></div>
                     </div>
                </div>
            </Card>
        </div>
    );
}
