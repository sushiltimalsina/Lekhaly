// apps/desktop/src/pages/vouchers/journal-create.tsx
import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { DualDateInput } from "@/components/app/dual-date-input";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";
import { createVoucherDraft, listVouchers, type VoucherRecord } from "@/lib/api/vouchers";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import {
    Plus,
    Trash2,
    Save,
    Check,
    AlertCircle,
    History,
    FileText,
    ArrowRightCircle,
    X,
    Clock,
    User,
    Book,
    Settings,
    Printer,
    ArrowLeft
} from "lucide-react";
import SearchableSelect from "@/components/app/searchable-select";
import { useNavigate } from "react-router-dom";
import { adToBs } from "@/lib/dates/convert";

type JournalLine = {
    id: string;
    type: "dr" | "cr";
    accountId: string;
    partyId: string;
    description: string;
    amount: string;
};

type LedgerOption = {
    id: string;
    name: string;
    type: "account" | "party";
    category?: string;
};

export default function JournalCreatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [recentVouchers, setRecentVouchers] = React.useState<VoucherRecord[]>([]);
    const [showHistory, setShowHistory] = React.useState(false);

    const [form, setForm] = React.useState({
        date: { ad: new Date().toISOString().split('T')[0], bs: adToBs(new Date().toISOString().split('T')[0]) },
        memo: "",
        referenceNo: "",
        voucherNo: "NEW",
    });

    const [lines, setLines] = React.useState<JournalLine[]>([
        { id: Math.random().toString(), type: "dr", accountId: "", partyId: "", description: "", amount: "" },
        { id: Math.random().toString(), type: "cr", accountId: "", partyId: "", description: "", amount: "" },
    ]);

    React.useEffect(() => {
        const load = async () => {
          try {
            const [a, p, v] = await Promise.all([
              listAccounts(),
              listParties(),
              listVouchers({ type: "journal", take: 5 })
            ]);
            setAccounts(a || []);
            setParties(p || []);
            const list = Array.isArray(v) ? v : v?.items ?? v?.data ?? [];
            setRecentVouchers(list);
          } catch (e) {
            console.error(e);
          }
        };
        load();
    }, []);

    const ledgerOptions = React.useMemo<LedgerOption[]>(() => {
        const accs = accounts.map(a => ({ id: a.id, name: a.name, type: "account" as const, category: a.type }));
        const pts = parties.map(p => ({ id: p.id, name: p.name, type: "party" as const, category: p.type }));
        return [...accs, ...pts];
    }, [accounts, parties]);

    const totals = React.useMemo(() => {
        const dr = lines.filter(l => l.type === "dr").reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
        const cr = lines.filter(l => l.type === "cr").reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
        return { dr, cr, diff: Math.abs(dr - cr), balanced: Math.abs(dr - cr) < 0.01 && dr > 0 };
    }, [lines]);

    const addLine = () => {
        const lastType = lines[lines.length - 1]?.type === "dr" ? "cr" : "dr";
        setLines([...lines, { id: Math.random().toString(), type: lastType, accountId: "", partyId: "", description: "", amount: "" }]);
    };

    const removeLine = (id: string) => {
        if (lines.length <= 2) return;
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: string, updates: Partial<JournalLine>) => {
        setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const onSave = async () => {
        if (!totals.balanced) {
            setError("Journal must be balanced.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await createVoucherDraft({
                voucherType: "journal",
                voucherDate: form.date.ad,
                voucherDateBs: form.date.bs,
                memo: form.memo,
                referenceNo: form.referenceNo,
                lines: lines
                    .filter(l => (l.accountId || l.partyId) && parseFloat(l.amount))
                    .map(l => ({
                        accountId: l.accountId || undefined,
                        partyId: l.partyId || undefined,
                        description: l.description,
                        debit: l.type === "dr" ? parseFloat(l.amount) : 0,
                        credit: l.type === "cr" ? parseFloat(l.amount) : 0,
                    }))
            });
            navigate(`/vouchers/view/${res.id}`);
        } catch (e: any) {
            setError(e?.message ?? "Failed to save journal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate("/vouchers")} className="rounded-full h-10 px-4 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
                </Button>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="h-11 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                        <History className="mr-2 h-4 w-4" /> History
                    </Button>
                    <Button onClick={onSave} disabled={loading || !totals.balanced} className="h-11 px-8 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 italic">
                        <Save className="mr-2 h-4 w-4" /> Commit Journal
                    </Button>
                </div>
            </div>

            <PageHeader 
                title="Journal Voucher Entry" 
                description="Perform general ledger adjustments and direct account transfers." 
            />

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-black text-rose-600 uppercase tracking-widest animate-shake flex items-center gap-3">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Metadata */}
                    <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm flex flex-wrap gap-12">
                        <div className="w-[240px]">
                            <DualDateInput
                                label="Voucher Date"
                                value={form.date}
                                accentColor="bg-indigo-600"
                                onChange={(date) => setForm(f => ({ ...f, date }))}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Reference / Adjustment No.</label>
                            <Input
                                value={form.referenceNo}
                                onChange={(e) => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                                placeholder="Adjustment ID / Internal Reference"
                                className="h-11 rounded-2xl border-slate-100 font-bold"
                            />
                        </div>
                    </div>

                    {/* Entry Table */}
                    <div className="bg-white rounded-[32px] border-2 border-slate-50 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-12">#</th>
                                    <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-24 text-center">Rule</th>
                                    <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Account Detail</th>
                                    <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-32 text-right">Debit</th>
                                    <th className="px-2 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-32 text-right">Credit</th>
                                    <th className="px-6 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lines.map((line, idx) => (
                                    <tr key={line.id} className="group hover:bg-indigo-50/10 active:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-[10px] font-black text-slate-300">{idx + 1}</td>
                                        <td className="px-2 py-4">
                                            <button
                                                onClick={() => updateLine(line.id, { type: line.type === "dr" ? "cr" : "dr" })}
                                                className={cn(
                                                    "w-full h-9 rounded-xl text-[9px] font-black transition-all flex items-center justify-center uppercase tracking-widest border-2 shadow-sm",
                                                    line.type === "dr" ? "bg-blue-600 border-blue-500 text-white" : "bg-rose-600 border-rose-500 text-white"
                                                )}
                                            >
                                                {line.type}
                                            </button>
                                        </td>
                                        <td className="px-2 py-4">
                                            <SearchableSelect<LedgerOption>
                                                valueId={line.accountId || line.partyId}
                                                onChange={(id, opt) => {
                                                    if (opt?.type === "account") updateLine(line.id, { accountId: id, partyId: "" });
                                                    else updateLine(line.id, { partyId: id, accountId: "" });
                                                }}
                                                options={ledgerOptions}
                                                getLabel={(opt) => opt.name}
                                                placeholder="Select account..."
                                                buttonClassName="h-10 rounded-xl border-slate-100 bg-transparent font-bold capitalize"
                                                leftIcon={line.partyId ? <User className="h-4 w-4" /> : <Book className="h-4 w-4" />}
                                            />
                                        </td>
                                        <td className="px-2 py-4">
                                            <Input
                                                type="number"
                                                value={line.type === "dr" ? line.amount : ""}
                                                disabled={line.type !== "dr"}
                                                onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                                                className="h-10 rounded-xl text-right font-black border-slate-100 focus:border-blue-500 transition-all disabled:bg-slate-50/50 disabled:border-transparent"
                                            />
                                        </td>
                                        <td className="px-2 py-4">
                                            <Input
                                                type="number"
                                                value={line.type === "cr" ? line.amount : ""}
                                                disabled={line.type !== "cr"}
                                                onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                                                className="h-10 rounded-xl text-right font-black border-slate-100 focus:border-rose-500 transition-all disabled:bg-slate-50/50 disabled:border-transparent"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => removeLine(line.id)} disabled={lines.length <= 2} className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 disabled:hidden">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-6 bg-slate-50/30 border-t border-slate-100">
                             <Button variant="outline" onClick={addLine} className="h-12 w-full rounded-2xl border-dashed border-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:bg-indigo-50">
                                <Plus className="mr-2 h-4 w-4" /> Append Registry Row
                             </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Audit Summary */}
                    <div className="p-8 bg-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><FileText className="h-24 w-24" /></div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 border-b border-white/5 pb-4">Audit Totals</div>
                        <div className="space-y-6">
                            <div className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col gap-1", totals.balanced ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20 animate-pulse")}>
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", totals.balanced ? "text-emerald-400" : "text-rose-400")}>
                                    {totals.balanced ? "Double Entry Balanced" : "Out of Balance"}
                                </span>
                                <div className="text-3xl font-black tabular-nums tracking-tighter"><MoneyText value={totals.dr} /></div>
                                {!totals.balanced && totals.dr > 0 && (
                                    <div className="text-[10px] font-bold text-rose-300 mt-2">Diff: <MoneyText value={totals.diff} /></div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Final Memo */}
                    <div className="p-8 bg-white rounded-[32px] border-2 border-slate-50 shadow-sm space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Auditor Remarks (Memo)</label>
                        <textarea
                            value={form.memo}
                            onChange={(e) => setForm(f => ({ ...f, memo: e.target.value }))}
                            placeholder="Overall sequence narration..."
                            className="min-h-[140px] w-full rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium leading-relaxed resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* History Sidebar/Drawer */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in transition-all">
                    <div className="w-[400px] h-full bg-white shadow-2xl p-8 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 italic flex items-center gap-3">
                                <History className="h-5 w-5 text-indigo-600" /> Recent Journals
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="rounded-xl h-10 w-10">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {recentVouchers.map(v => (
                                <div key={v.id} onClick={() => { navigate(`/vouchers/view/${v.id}`); setShowHistory(false); }} className="p-5 rounded-3xl border border-slate-100 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[11px] font-black text-slate-900 uppercase">#{v.voucherNo}</span>
                                        <span className="text-sm font-black group-hover:text-indigo-600"><MoneyText value={v.amount} /></span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{v.voucherDateBs}</div>
                                    <div className="mt-2 text-[11px] text-slate-500 italic line-clamp-1">{v.memo || "No memo"}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

