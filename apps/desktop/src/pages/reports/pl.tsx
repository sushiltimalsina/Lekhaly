// apps/desktop/src/pages/reports/pl.tsx
import * as React from "react";
import { 
    Printer, 
    FileDown, 
    RefreshCw, 
    AlertCircle, 
    TrendingUp, 
    TrendingDown, 
    Landmark, 
    Calculator,
    ChevronLeft,
    Plus,
    Minus,
    ArrowUpRight,
    ArrowDownRight,
    Scale
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyText } from "@/components/app/money";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getProfitLoss } from "@/lib/api/reports";
import { cn } from "@/lib/utils";

type Row = {
  section?: string;
  name?: string;
  amount?: number;
};

export default function ProfitLossPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [rows, setRows] = React.useState<Row[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState({ from: null as Date | null, to: null as Date | null });

    const run = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getProfitLoss({
                from: filters.from?.toISOString() || undefined,
                to: filters.to?.toISOString() || undefined
            });
            setRows(Array.isArray(res) ? res : (res as any)?.rows || []);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load profit & loss");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { run(); }, [filters]);

    const categorize = (items: Row[]) => {
        const income = items.filter(r => ["income", "revenue", "operating-income", "operating income"].includes(r.section?.toLowerCase() ?? ""));
        const cogs = items.filter(r => ["cogs", "direct-expense", "direct expense", "cost of goods sold"].includes(r.section?.toLowerCase() ?? ""));
        const otherExpense = items.filter(r => ["expense", "operating-expense", "operating expense", "indirect-expense", "indirect expense"].includes(r.section?.toLowerCase() ?? ""));
        
        // Catch-all categorization
        const rest = items.filter(r => !income.includes(r) && !cogs.includes(r) && !otherExpense.includes(r));
        rest.forEach(r => {
            const sec = r.section?.toLowerCase() ?? "";
            if (sec.includes("income")) income.push(r);
            else if (sec.includes("direct") || sec.includes("cogs")) cogs.push(r);
            else otherExpense.push(r);
        });

        return { income, cogs, otherExpense };
    };

    const { income, cogs, otherExpense } = categorize(rows);

    const totals = {
        income: income.reduce((s, r) => s + (r.amount || 0), 0),
        cogs: cogs.reduce((s, r) => s + (r.amount || 0), 0),
        otherExpense: otherExpense.reduce((s, r) => s + (r.amount || 0), 0),
    };

    const grossProfit = totals.income - totals.cogs;
    const netProfit = grossProfit - totals.otherExpense;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest mb-2">
                        <ChevronLeft className="h-3.5 w-3.5" /> Intelligence Center
                    </button>
                    <PageHeader title="Profit & Loss" description="Analytical income and expenditure statement with operational depth." />
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
                <SummaryTile title="Total Revenue" value={totals.income} icon={TrendingUp} color="blue" />
                <SummaryTile title="Gross Profit" value={grossProfit} icon={Calculator} color="orange" />
                <SummaryTile title="Operating Burn" value={totals.cogs + totals.otherExpense} icon={TrendingDown} color="rose" />
                <SummaryTile title="Net Sustainability" value={netProfit} icon={Landmark} color={netProfit >= 0 ? "emerald" : "red"} isDark />
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

            <Card className="rounded-[42px] border-2 border-slate-50 shadow-2xl overflow-hidden bg-white max-w-4xl mx-auto">
                <div className="p-12 text-center border-b border-slate-100 bg-slate-50/30">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Profit & Loss Registry</h1>
                    <div className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Audit Period: {filters.from?.toLocaleDateString()} — {filters.to?.toLocaleDateString()}</div>
                </div>

                <CardContent className="p-10 md:p-16 space-y-12">
                    {/* Revenue Section */}
                    <ReportSection title="Operating Revenue" items={income} total={totals.income} highlightColor="text-blue-600" />
                    
                    {/* COGS Section */}
                    <ReportSection title="Cost of Goods Sold (Direct)" items={cogs} total={totals.cogs} highlightColor="text-orange-600" />

                    {/* Gross Profit Divider */}
                    <div className="py-6 border-y-2 border-slate-900/10 bg-slate-50/50 -mx-10 px-10 flex items-center justify-between rounded-xl">
                        <span className="text-base font-black uppercase tracking-tighter text-slate-900 italic flex items-center gap-3">
                            <Plus className="h-4 w-4 text-emerald-500" /> Gross Operational Profit
                        </span>
                        <div className="text-2xl font-black text-emerald-600 tabular-nums italic"><MoneyText value={grossProfit} /></div>
                    </div>

                    {/* Expenses Section */}
                    <ReportSection title="Indirect Operating Expenses" items={otherExpense} total={totals.otherExpense} highlightColor="text-rose-600" />

                    {/* Final Net Profit */}
                    <div className="mt-16 pt-10 border-t-4 border-slate-900 border-double">
                        <div className={cn(
                            "p-10 rounded-[32px] flex items-center justify-between shadow-2xl relative overflow-hidden",
                            netProfit >= 0 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        )}>
                            <div className="space-y-1 relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Authenticated Net Influx</span>
                                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Net Profit / (Loss) for Period</h1>
                            </div>
                            <div className="text-5xl font-black tabular-nums tracking-tighter relative z-10 italic">
                                <MoneyText value={netProfit} />
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10 -mr-4 -mt-4">
                                <Scale className="h-32 w-32" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ReportSection({ title, items, total, highlightColor }: any) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h3>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Magnitude</span>
            </div>
            <div className="space-y-4">
                {items.length > 0 ? items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{item.name}</span>
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-slate-50 w-24" />
                            <MoneyText value={item.amount} className="text-sm font-black text-slate-900 tabular-nums grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                    </div>
                )) : (
                    <div className="text-xs text-slate-300 italic">No transactional records in this registry.</div>
                )}
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-dashed border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total {title}</span>
                <div className={cn("text-lg font-black tabular-nums", highlightColor)}>
                    <MoneyText value={total} />
                </div>
            </div>
        </div>
    );
}

function SummaryTile({ title, value, icon: Icon, color, isDark = false }: any) {
    return (
        <div className={cn(
            "p-6 rounded-[30px] border-2 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group transition-all",
            isDark ? "bg-slate-900 border-slate-800 text-white" : `bg-white border-slate-50 text-slate-900 hover:border-emerald-100`
        )}>
            <div className="flex justify-between items-start relative z-10">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] italic", isDark ? "text-slate-500" : `text-${color}-500/60`)}>{title}</span>
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", isDark ? "bg-white/10 text-white" : `bg-${color}-50 text-${color}-600`)}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-black tracking-tighter relative z-10 tabular-nums italic">
                <MoneyText value={value} />
            </div>
        </div>
    );
}
