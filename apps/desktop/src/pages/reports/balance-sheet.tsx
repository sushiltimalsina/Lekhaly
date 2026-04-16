// apps/desktop/src/pages/reports/balance-sheet.tsx
import * as React from "react";
import { 
    Printer, 
    FileDown, 
    RefreshCw, 
    AlertCircle, 
    ShieldCheck, 
    Scale, 
    PieChart,
    ChevronLeft,
    TrendingUp,
    TrendingDown,
    Building,
    Wallet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { Card, CardContent } from "@lekhaly/ui";
import { MoneyText } from "@/components/app/money";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getBalanceSheet } from "@/lib/api/reports";
import { cn } from "@/lib/utils";

type Row = {
  section?: string | "assets" | "liabilities" | "equity";
  name?: string;
  amount?: number;
};

export default function BalanceSheetPage() {
    const navigate = useNavigate();
    const [asOf, setAsOf] = React.useState<Date | null>(new Date());
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<Row[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const run = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBalanceSheet({
                asOf: asOf?.toISOString() || undefined,
            });
            setRows(Array.isArray(res) ? res : (res as any)?.rows || []);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load balance sheet");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { run(); }, [asOf]);

    const assetItems = rows.filter(r => r.section?.toLowerCase() === "assets");
    const liabilityItems = rows.filter(r => r.section?.toLowerCase() === "liabilities");
    const equityItems = rows.filter(r => r.section?.toLowerCase() === "equity");

    const totalAssets = assetItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);
    const totalLiabilities = liabilityItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);
    const totalEquity = equityItems.reduce((acc, r) => acc + (r.amount ?? 0), 0);

    const balanceCheck = Math.abs(totalAssets - (totalLiabilities + totalEquity));
    const isBalanced = balanceCheck < 1;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-2">
                        <ChevronLeft className="h-3.5 w-3.5" /> Intelligence Center
                    </button>
                    <PageHeader title="Balance Sheet" description="Equilibrium audit of organizational assets, obligations, and net equity." />
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={run} disabled={loading} className="h-11 rounded-2xl font-black text-xs uppercase tracking-widest px-6 border-slate-100">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-2xl font-black text-xs uppercase tracking-widest px-6 border-slate-100">
                        <Printer className="mr-2 h-4 w-4" /> Print PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <BalanceStat title="Total Resource Assets" value={totalAssets} icon={Building} color="blue" />
                <BalanceStat title="Total Obligations" value={totalLiabilities} icon={TrendingDown} color="rose" />
                <BalanceStat title="Shareholder Equity" value={totalEquity} icon={Wallet} color="indigo" />
                <div className={cn(
                    "p-6 rounded-[30px] border-2 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all",
                    isBalanced ? "bg-emerald-600 border-none text-white shadow-xl shadow-emerald-100" : "bg-white border-orange-100 text-orange-600"
                )}>
                    <div className="flex justify-between items-start relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-60">Accounting Equilibrium</span>
                        <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                            <Scale className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black tracking-tighter relative z-10 italic uppercase">
                        {isBalanced ? "Balanced" : "Mismatch Detected"}
                    </div>
                </div>
            </div>

            <AdvancedFilterBar 
                onFilterChange={f => setAsOf(f.dateRange?.to || f.dateRange?.from || null)}
                defaultRange="this_year"
            />

            {error && (
                <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-700 font-black text-xs uppercase tracking-widest flex items-center gap-4 text-rose-600">
                    <AlertCircle className="h-6 w-6" /> {error}
                </div>
            )}

            <Card className="rounded-[42px] border-2 border-slate-50 shadow-2xl overflow-hidden bg-white max-w-6xl mx-auto border-none">
                <div className="p-12 text-center border-b border-slate-100 bg-slate-50/30">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Statement of Financial Position</h1>
                    <div className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Snapshot Date (As of): {asOf?.toLocaleDateString() || "Today"}</div>
                </div>

                <div className="grid md:grid-cols-2 divide-x-2 divide-slate-100 min-h-[600px] relative">
                    {/* Left Column: Assets */}
                    <div className="p-10 md:p-14 space-y-10 flex flex-col">
                        <div className="flex-1 space-y-8">
                            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2 italic">
                                    <PieChart className="h-4 w-4 text-blue-500" /> Resource Assets
                                </h3>
                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Valuation</div>
                            </div>
                            <div className="space-y-4">
                                {assetItems.length > 0 ? assetItems.map((item, i) => (
                                    <ReportRow key={i} name={item.name!} amount={item.amount!} />
                                )) : <div className="text-xs text-slate-300 italic">No asset registries found.</div>}
                            </div>
                        </div>
                        <div className="mt-auto pt-8 flex items-center justify-between border-t-4 border-slate-900 sticky bottom-0 bg-white">
                            <span className="text-sm font-black uppercase tracking-tighter italic">Total Resource Assets</span>
                            <div className="text-2xl font-black text-blue-600 tabular-nums italic"><MoneyText value={totalAssets} /></div>
                        </div>
                    </div>

                    {/* Right Column: Liabilities & Equity */}
                    <div className="p-10 md:p-14 space-y-12 bg-slate-50/20 flex flex-col">
                        <div className="flex-1 space-y-12">
                            {/* Liabilities Section */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">Organizational Obligations</h3>
                                    <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Commitment</div>
                                </div>
                                <div className="space-y-4">
                                     {liabilityItems.length > 0 ? liabilityItems.map((item, i) => (
                                        <ReportRow key={i} name={item.name!} amount={item.amount!} highlight="text-rose-600" />
                                    )) : <div className="text-xs text-slate-300 italic">No liability obligations found.</div>}
                                </div>
                                <div className="pt-4 flex items-center justify-between border-t border-dashed border-slate-200">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-full pr-6 italic">Total Liabilities:</span>
                                    <div className="text-sm font-bold text-slate-900 tabular-nums"><MoneyText value={totalLiabilities} /></div>
                                </div>
                            </div>

                            {/* Equity Section */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">Owners' Equity Equity</h3>
                                </div>
                                <div className="space-y-4">
                                    {equityItems.length > 0 ? equityItems.map((item, i) => (
                                        <ReportRow key={i} name={item.name!} amount={item.amount!} highlight="text-indigo-600" />
                                    )) : <div className="text-xs text-slate-300 italic">No equity records found.</div>}
                                </div>
                                <div className="pt-4 flex items-center justify-between border-t border-dashed border-slate-200">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-full pr-6 italic">Total Net Equity:</span>
                                    <div className="text-sm font-bold text-slate-900 tabular-nums"><MoneyText value={totalEquity} /></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 flex items-center justify-between border-t-4 border-slate-900 sticky bottom-0 bg-white">
                            <span className="text-sm font-black uppercase tracking-tighter italic">Total Obligations & Equity</span>
                            <div className="text-2xl font-black text-emerald-600 tabular-nums italic"><MoneyText value={totalLiabilities + totalEquity} /></div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 text-white flex items-center justify-between border-none">
                    <div className="flex gap-12 font-black uppercase text-[10px] tracking-[0.3em] text-slate-500 italic">
                        <span>Institution: Lekhaly Certified ERP</span>
                        <span>Audit Protocol: Dual-Entry Equilibrium</span>
                    </div>
                    <div className="flex items-center gap-6">
                         <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border-2", isBalanced ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-rose-500/30 text-rose-400 bg-rose-500/10")}>
                             {isBalanced ? "Equation Balanced" : "Balance Variance Warning"}
                         </div>
                         <span className="text-[10px] font-black text-slate-500 mono-numbers uppercase tracking-widest">{new Date().toLocaleString()}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function ReportRow({ name, amount, highlight }: { name: string, amount: number, highlight?: string }) {
    return (
        <div className="flex items-center justify-between group">
            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{name}</span>
            <div className="flex items-center gap-4">
                <div className="h-[2px] w-8 bg-slate-50 group-hover:w-12 transition-all" />
                <MoneyText value={amount} className={cn("text-sm font-black tabular-nums italic", highlight || "text-slate-900")} />
            </div>
        </div>
    );
}

function BalanceStat({ title, value, icon: Icon, color }: any) {
    return (
        <div className={cn(
            "p-6 rounded-[30px] border-2 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group transition-all bg-white border-slate-100 hover:border-indigo-100"
        )}>
            <div className="flex justify-between items-start relative z-10">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-400")}>{title}</span>
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", `bg-${color}-50 text-${color}-600`)}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-black tracking-tighter relative z-10 tabular-nums italic text-slate-900">
                <MoneyText value={value} />
            </div>
        </div>
    );
}
