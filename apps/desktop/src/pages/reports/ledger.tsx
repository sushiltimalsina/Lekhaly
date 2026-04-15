// apps/desktop/src/pages/reports/ledger.tsx
import * as React from "react";
import { 
    Printer, 
    FileDown, 
    RefreshCw, 
    AlertCircle, 
    BookOpen, 
    Building2, 
    Search, 
    ArrowDownUp, 
    TrendingUp, 
    TrendingDown, 
    Scale,
    ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import SearchableSelect from "@/components/app/searchable-select";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getLedger } from "@/lib/api/reports";
import { listAccounts } from "@/lib/api/accounts";
import { listParties } from "@/lib/api/parties";
import { getSettings } from "@/lib/store/settings";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";

type LedgerRow = {
  date: string;
  dateBs: string;
  ref: string;
  memo: string;
  debit: number;
  credit: number;
  balance: number;
};

export default function LedgerReportPage() {
    const navigate = useNavigate();
    const settings = getSettings();
    const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

    const [loading, setLoading] = React.useState(false);
    const [fetched, setFetched] = React.useState(false);
    const [data, setData] = React.useState<LedgerRow[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const [accounts, setAccounts] = React.useState<any[]>([]);
    const [parties, setParties] = React.useState<any[]>([]);
    const [filters, setFilters] = React.useState({
        accountId: "",
        partyId: "",
        from: null as Date | null,
        to: null as Date | null,
    });

    React.useEffect(() => {
        const init = async () => {
            try {
                const [accs, pts] = await Promise.all([
                    listAccounts({ take: 500 }),
                    listParties({ take: 500 })
                ]);
                // FIXED: Direct array assignment since registry APIs return arrays
                setAccounts(accs || []);
                setParties(pts || []);
            } catch (e) { console.error(e); }
        };
        init();
    }, []);

    const runReport = async () => {
        if (!filters.accountId && !filters.partyId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getLedger({
                accountId: filters.accountId || undefined,
                partyId: filters.partyId || undefined,
                from: filters.from?.toISOString() || undefined,
                to: filters.to?.toISOString() || undefined
            });
            setData(Array.isArray(res) ? res : (res as any)?.rows || []);
            setFetched(true);
        } catch (e: any) {
            setError(e?.message ?? "Failed to fetch ledger data");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (filters.accountId || filters.partyId) runReport();
    }, [filters]);

    const stats = React.useMemo(() => {
        if (data.length === 0) return { opening: 0, debit: 0, credit: 0, closing: 0 };
        const debit = data.reduce((s, r) => s + (r.debit || 0), 0);
        const credit = data.reduce((s, r) => s + (r.credit || 0), 0);
        const closing = data[data.length - 1].balance;
        const opening = (data[0].balance - (data[0].debit || 0) + (data[0].credit || 0));
        return { opening, debit, credit, closing };
    }, [data]);

    const columns = [
        {
            key: "date",
            header: "Date",
            cell: (r: LedgerRow) => {
                const d = getDateDisplay({ ad: r.date, bs: r.dateBs, format: calendarFmt });
                return (
                    <div className="flex flex-col">
                         <span className="font-bold text-slate-700">{d.primary}</span>
                         <span className="text-[10px] text-slate-400 font-medium">{d.secondary}</span>
                    </div>
                );
            }
        },
        { key: "ref", header: "Reference", cell: (r: LedgerRow) => <span className="font-black text-slate-400 tabular-nums uppercase text-[10px]">{r.ref || "—"}</span> },
        { key: "memo", header: "Narration / Detail", cell: (r: LedgerRow) => <span className="text-slate-600 font-medium line-clamp-1 italic text-xs">{r.memo || "—"}</span> },
        { key: "debit", header: "Debit", align: "right" as const, cell: (r: LedgerRow) => <MoneyText value={r.debit} className={cn("font-bold", r.debit > 0 ? "text-indigo-600" : "text-slate-200")} /> },
        { key: "credit", header: "Credit", align: "right" as const, cell: (r: LedgerRow) => <MoneyText value={r.credit} className={cn("font-bold", r.credit > 0 ? "text-rose-600" : "text-slate-200")} /> },
        { key: "balance", header: "Running Balance", align: "right" as const, cell: (r: LedgerRow) => (
            <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 font-black text-slate-900 shadow-sm">
                <MoneyText value={r.balance} />
            </div>
        ) }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button onClick={() => navigate("/reports")} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-2">
                        <ChevronLeft className="h-3.5 w-3.5" /> Intelligence Center
                    </button>
                    <PageHeader title="General Ledger" description="Granular transaction audit with real-time balance reconciliation." />
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={runReport} disabled={loading} className="h-11 rounded-2xl border-2 font-black text-xs uppercase tracking-widest px-6 border-slate-100">
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="h-11 rounded-2xl border-2 font-black text-xs uppercase tracking-widest px-6 border-slate-100">
                        <Printer className="mr-2 h-4 w-4" /> Print PDF
                    </Button>
                </div>
            </div>

            <Card className="rounded-[32px] border-2 border-slate-50 shadow-sm overflow-hidden">
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                                <BookOpen className="h-3 w-3" /> Select Account
                            </label>
                            <SearchableSelect
                                options={accounts}
                                valueId={filters.accountId}
                                onChange={(id) => setFilters(f => ({ ...f, accountId: id, partyId: "" }))}
                                getLabel={a => `${a.code ? a.code + ' — ' : ''}${a.name}`}
                                placeholder="Choose account..."
                                buttonClassName="h-12 rounded-xl border-slate-100 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                                <Building2 className="h-3 w-3" /> Select Party
                            </label>
                            <SearchableSelect
                                options={parties}
                                valueId={filters.partyId}
                                onChange={(id) => setFilters(f => ({ ...f, partyId: id, accountId: "" }))}
                                getLabel={p => p.name}
                                placeholder="Choose customer/vendor..."
                                buttonClassName="h-12 rounded-xl border-slate-100 font-bold"
                            />
                        </div>
                        <div className="lg:col-span-2">
                             <AdvancedFilterBar 
                                className="border-none shadow-none p-0 bg-transparent"
                                onFilterChange={(f) => setFilters(prev => ({ ...prev, from: f.dateRange?.from || null, to: f.dateRange?.to || null }))}
                                defaultRange="this_year"
                             />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {!fetched && !loading && (
                <div className="group py-32 flex flex-col items-center justify-center space-y-6 border-2 border-dashed border-slate-100 rounded-[42px] bg-slate-50/30">
                     <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center border-2 border-slate-50 shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <Search className="h-10 w-10 text-slate-200" />
                     </div>
                     <div className="text-center space-y-1">
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm italic">Audit Awaiting Parameters</h3>
                        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto italic">Select an account or party profile from the registry above to initiate the ledger audit.</p>
                     </div>
                </div>
            )}

            {error && (
                <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl text-rose-700 font-black text-xs uppercase tracking-widest flex items-center gap-4 animate-shake text-rose-600">
                    <AlertCircle className="h-6 w-6" /> {error}
                </div>
            )}

            {fetched && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <SummaryStat title="Opening Balance" value={stats.opening} icon={Scale} color="indigo" />
                        <SummaryStat title="Total Periodic Debit" value={stats.debit} icon={TrendingUp} color="blue" />
                        <SummaryStat title="Total Periodic Credit" value={stats.credit} icon={TrendingDown} color="rose" />
                        <SummaryStat title="Net Closing Balance" value={stats.closing} icon={ArrowDownUp} color="slate" isDark />
                    </div>

                    <div className="bg-white rounded-[42px] border-2 border-slate-100 shadow-2xl overflow-hidden relative group">
                        <div className="hidden print:flex flex-col items-center p-12 border-b border-slate-100 bg-slate-50/50">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Lekhaly Institutional Ledger</h1>
                            <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                                <span>Period: {filters.from?.toLocaleDateString()} — {filters.to?.toLocaleDateString()}</span>
                                <span>Registry: {filters.accountId ? "Account Ledger" : "Party Ledger"}</span>
                            </div>
                        </div>
                        <DataTable columns={columns} rows={data} loading={loading} className="border-none" />
                        <div className="p-10 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-none">
                            <div className="flex gap-16 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">
                                <div className="space-y-2"><span>Total Debit Influx</span><div className="text-2xl text-white tracking-tighter tabular-nums"><MoneyText value={stats.debit} /></div></div>
                                <div className="space-y-2"><span>Total Credit Outflux</span><div className="text-2xl text-white tracking-tighter tabular-nums"><MoneyText value={stats.credit} /></div></div>
                            </div>
                            <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 text-right min-w-[240px]">
                                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-2">Authenticated Closing Balance</span>
                                 <div className="text-4xl font-black tracking-tighter tabular-nums text-white italic"><MoneyText value={stats.closing} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryStat({ title, value, icon: Icon, color, isDark = false }: any) {
    return (
        <div className={cn(
            "p-6 rounded-[30px] border-2 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group",
            isDark ? "bg-slate-900 border-slate-800 text-white" : `bg-white border-slate-50 text-slate-900 hover:border-indigo-100 transition-all`
        )}>
            <div className="flex justify-between items-start relative z-10">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] italic", isDark ? "text-slate-500" : `text-indigo-400`)}>{title}</span>
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", isDark ? "bg-white/10 text-white" : `bg-indigo-50 text-indigo-600`)}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-black tracking-tighter relative z-10 tabular-nums">
                <MoneyText value={value} />
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
                <Icon className="h-20 w-20" />
            </div>
        </div>
    );
}
