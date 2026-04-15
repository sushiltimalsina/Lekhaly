// apps/desktop/src/pages/reports/trial-balance.tsx
import * as React from "react";
import { 
    Printer, 
    FileDown, 
    RefreshCw, 
    AlertCircle, 
    Scale,
    ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getTrialBalance } from "@/lib/api/reports";
import { cn } from "@/lib/utils";

type TbRow = {
    accountCode?: string;
    accountName?: string;
    debit?: number;
    credit?: number;
};

export default function TrialBalanceReportPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<TbRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState({ from: null as Date | null, to: null as Date | null });

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getTrialBalance({
                from: filters.from?.toISOString() || undefined,
                to: filters.to?.toISOString() || undefined
            });
            setData(Array.isArray(res) ? res : (res as any)?.rows || []);
        } catch (e: any) {
            setError(e?.message ?? "Failed to fetch trial balance");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { load(); }, [filters]);

    const totals = React.useMemo(() => {
        const debit = data.reduce((s, r) => s + (r.debit || 0), 0);
        const credit = data.reduce((s, r) => s + (r.credit || 0), 0);
        return { debit, credit, isBalanced: Math.abs(debit - credit) < 0.01 };
    }, [data]);

    const columns = [
        {
            key: "account",
            header: "Financial Account Registry",
            cell: (r: TbRow) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{r.accountName}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.accountCode || "SYSTEM"}</span>
                </div>
            )
        },
        { key: "debit", header: "Debit Magnitude", align: "right" as const, cell: (r: TbRow) => <MoneyText value={r.debit || 0} className={cn("font-bold", (r.debit || 0) > 0 ? "text-slate-900" : "text-slate-200")} /> },
        { key: "credit", header: "Credit Magnitude", align: "right" as const, cell: (r: TbRow) => <MoneyText value={r.credit || 0} className={cn("font-bold", (r.credit || 0) > 0 ? "text-slate-900" : "text-slate-200")} /> }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest mb-2">
                        <ChevronLeft className="h-3.5 w-3.5" /> Intelligence Center
                    </button>
                    <PageHeader title="Trial Balance" description="Structural integrity audit for the entire accounting lifecycle." />
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={load} disabled={loading} className="h-11 rounded-2xl font-black text-xs uppercase tracking-widest px-6">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh Audit
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-2xl font-black text-xs uppercase tracking-widest px-6">
                        <Printer className="mr-2 h-4 w-4" /> Export Document
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-[32px] border-2 border-slate-50 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Periodic Debit Influx</span>
                        <div className="text-2xl font-black text-slate-900 tabular-nums"><MoneyText value={totals.debit} /></div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><Scale className="h-6 w-6" /></div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border-2 border-slate-50 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Periodic Credit Outflux</span>
                        <div className="text-2xl font-black text-slate-900 tabular-nums"><MoneyText value={totals.credit} /></div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Scale className="h-6 w-6" /></div>
                </div>
                <div className={cn("p-6 rounded-[32px] border-2 flex items-center justify-between transition-all", totals.isBalanced ? "bg-emerald-600 border-none text-white shadow-xl shadow-emerald-100" : "bg-rose-50 border-rose-100 text-rose-700")}>
                    <div className="space-y-1">
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", totals.isBalanced ? "text-emerald-200" : "text-rose-400")}>Audit Status</span>
                        <div className="text-2xl font-black italic uppercase tracking-tighter">{totals.isBalanced ? "Mathematically Balanced" : "Balance Mismatch"}</div>
                    </div>
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", totals.isBalanced ? "bg-white/20" : "bg-rose-100 font-bold")}>
                        <AlertCircle className="h-6 w-6" />
                    </div>
                </div>
            </div>

            <AdvancedFilterBar 
                onFilterChange={f => setFilters({ from: f.dateRange?.from || null, to: f.dateRange?.to || null })}
                defaultRange="this_year"
            />

            {error && (
                <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-700 font-black text-xs uppercase tracking-widest flex items-center gap-4 text-rose-600">
                    <AlertCircle className="h-6 w-6" /> {error}
                </div>
            )}

            <Card className="rounded-[42px] border-2 border-slate-50 shadow-2xl overflow-hidden min-h-[500px]">
                <div className="hidden print:flex flex-col items-center p-12 border-b-4 border-slate-900 bg-white">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Lekhaly Trial Balance</h1>
                    <div className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Audit Period: {filters.from?.toLocaleDateString()} — {filters.to?.toLocaleDateString()}</div>
                </div>
                <DataTable columns={columns} rows={data} loading={loading} className="border-none" />
                <div className="p-10 bg-slate-50 border-t-2 border-slate-100 flex justify-end gap-12">
                     <div className="text-right space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-4">Registry Reconciliation Total</span>
                         <div className="bg-slate-900 text-white rounded-3xl p-6 flex items-center gap-12 shadow-2xl overflow-hidden">
                             <div className="flex flex-col items-end border-r border-white/10 pr-12">
                                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Total Debits</span>
                                 <div className="text-2xl font-black tabular-nums"><MoneyText value={totals.debit} /></div>
                             </div>
                             <div className="flex flex-col items-end">
                                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Total Credits</span>
                                 <div className="text-2xl font-black tabular-nums"><MoneyText value={totals.credit} /></div>
                             </div>
                         </div>
                     </div>
                </div>
            </Card>
        </div>
    );
}
