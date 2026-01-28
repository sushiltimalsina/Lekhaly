"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";
import { createVoucherDraft } from "@/lib/api/vouchers";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import {
    Plus,
    Trash2,
    Save,
    Search,
    ChevronDown,
    Check,
    AlertCircle,
    Keyboard,
    Info,
    History,
    FileText,
    ArrowRightCircle,
    X,
    HelpCircle
} from "lucide-react";
import SearchableSelect from "@/components/app/searchable-select";
import { useRouter } from "next/navigation";

type JournalLine = {
    id: string;
    type: "dr" | "cr";
    accountId: string;
    partyId: string;
    description: string;
    amount: string;
};

export default function JournalCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [sending, setSending] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [parties, setParties] = React.useState<PartyRecord[]>([]);

    const [form, setForm] = React.useState({
        date: { bs: "", ad: "" },
        memo: "",
        referenceNo: "",
        voucherNo: "NEW", // Auto-generated usually
        series: "Main",
    });

    const [lines, setLines] = React.useState<JournalLine[]>([
        { id: Math.random().toString(), type: "dr", accountId: "", partyId: "", description: "", amount: "" },
        { id: Math.random().toString(), type: "cr", accountId: "", partyId: "", description: "", amount: "" },
    ]);

    React.useEffect(() => {
        listAccounts().then(setAccounts).catch(console.error);
        listParties().then(setParties).catch(console.error);
    }, []);

    const totals = React.useMemo(() => {
        const dr = lines.filter(l => l.type === "dr").reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
        const cr = lines.filter(l => l.type === "cr").reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
        return {
            dr,
            cr,
            diff: Math.abs(dr - cr),
            balanced: Math.abs(dr - cr) < 0.01 && dr > 0
        };
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
            setError("Journal must be balanced and total must be greater than zero.");
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
                    .filter(l => l.accountId && parseFloat(l.amount))
                    .map(l => ({
                        accountId: l.accountId,
                        partyId: l.partyId || undefined,
                        description: l.description,
                        debit: l.type === "dr" ? parseFloat(l.amount) : 0,
                        credit: l.type === "cr" ? parseFloat(l.amount) : 0,
                    }))
            });
            router.push(`/vouchers/${res.id}`);
        } catch (e: any) {
            setError(e?.message ?? "Failed to save journal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 font-sans">
            {/* Top Bar / Breadcrumb area */}
            <div className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-3 dark:bg-slate-900/50 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Add Journal Voucher</h1>
                        <p className="text-xs text-muted-foreground">Voucher Series: <span className="font-semibold text-slate-700 dark:text-slate-300">{form.series}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl h-9">
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={loading || sending || !totals.balanced}
                        className="h-9 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? "Saving..." : "Save Voucher [F2]"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex flex-1 flex-col overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {error && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 animate-in fade-in slide-in-from-top-4">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                        </div>
                    )}

                    {/* Header Info Panel */}
                    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                        <div className="flex flex-wrap gap-8">
                            <div className="w-[280px]">
                                <DualDateInput
                                    label="Date"
                                    value={form.date}
                                    onChange={(date) => setForm(f => ({ ...f, date }))}
                                />
                            </div>
                            <div className="w-[180px] space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vch No.</label>
                                <Input
                                    value={form.voucherNo}
                                    readOnly
                                    className="h-10 rounded-xl bg-slate-50 border-slate-200 font-mono font-bold text-indigo-600"
                                />
                            </div>
                            <div className="w-[200px] space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reference / Instrument No.</label>
                                <Input
                                    value={form.referenceNo}
                                    onChange={(e) => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                                    placeholder="e.g. CHQ-8821"
                                    className="h-10 rounded-xl border-slate-200 hover:border-slate-300 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Entry Table Panel */}
                    <div className="flex flex-1 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50/80 sticky top-0 z-10 dark:bg-slate-800/50">
                                    <tr className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <th className="w-12 px-4 py-3 text-left">S.N.</th>
                                        <th className="w-20 px-4 py-3 text-center text-indigo-600">D/C</th>
                                        <th className="px-4 py-3 text-left min-w-[300px]">Account Name</th>
                                        <th className="w-44 px-4 py-3 text-right">Debit (Rs.)</th>
                                        <th className="w-44 px-4 py-3 text-right">Credit (Rs.)</th>
                                        <th className="px-4 py-3 text-left min-w-[200px]">Short Narration</th>
                                        <th className="w-10 px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {lines.map((line, idx) => (
                                        <tr key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-4 py-2.5 text-xs font-medium text-slate-400">{idx + 1}</td>
                                            <td className="px-2 py-2.5">
                                                <button
                                                    onClick={() => updateLine(line.id, { type: line.type === "dr" ? "cr" : "dr" })}
                                                    className={cn(
                                                        "w-full h-9 rounded-lg text-xs font-black transition-all flex items-center justify-center",
                                                        line.type === "dr"
                                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                                            : "bg-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-none"
                                                    )}
                                                >
                                                    {line.type.toUpperCase()}
                                                </button>
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <SearchableSelect<AccountRecord>
                                                    valueId={line.accountId}
                                                    onChange={(id) => updateLine(line.id, { accountId: id })}
                                                    options={accounts}
                                                    placeholder="Search account [F1]..."
                                                    buttonClassName="h-9 rounded-xl border-slate-200 bg-transparent hover:bg-white"
                                                />
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <Input
                                                    type="number"
                                                    value={line.type === "dr" ? line.amount : ""}
                                                    disabled={line.type !== "dr"}
                                                    onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                                                    placeholder="0.00"
                                                    className={cn(
                                                        "h-9 rounded-xl text-right font-bold transition-all",
                                                        line.type === "dr" ? "bg-white border-slate-300" : "bg-slate-50/50 border-transparent text-slate-300"
                                                    )}
                                                />
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <Input
                                                    type="number"
                                                    value={line.type === "cr" ? line.amount : ""}
                                                    disabled={line.type !== "cr"}
                                                    onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                                                    placeholder="0.00"
                                                    className={cn(
                                                        "h-9 rounded-xl text-right font-bold transition-all",
                                                        line.type === "cr" ? "bg-white border-slate-200" : "bg-slate-50/50 border-transparent text-slate-300"
                                                    )}
                                                />
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <Input
                                                    value={line.description}
                                                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                                    placeholder="Line note..."
                                                    className="h-9 rounded-xl border-slate-200 bg-transparent hover:bg-white focus:bg-white"
                                                />
                                            </td>
                                            <td className="px-2 py-2.5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLine(line.id)}
                                                    disabled={lines.length <= 2}
                                                    className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals & Add Button */}
                        <div className="border-t bg-slate-50/30 p-4 dark:bg-slate-800/30">
                            <div className="grid grid-cols-12 items-center gap-4">
                                <div className="col-span-3">
                                    <Button
                                        variant="outline"
                                        onClick={addLine}
                                        className="rounded-xl border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-white h-9 px-4 transition-all"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New Row [Ins]
                                    </Button>
                                </div>
                                <div className="col-span-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Total Amount</div>
                                <div className="col-span-2 text-right">
                                    <div className="text-sm font-bold text-blue-600">
                                        <MoneyText value={totals.dr} />
                                    </div>
                                </div>
                                <div className="col-span-2 text-right">
                                    <div className="text-sm font-bold text-rose-600">
                                        <MoneyText value={totals.cr} />
                                    </div>
                                </div>
                                <div className="col-span-2"></div>
                            </div>
                            {!totals.balanced && totals.dr > 0 && (
                                <div className="mt-3 flex items-center justify-end gap-2 text-xs font-semibold text-red-600">
                                    <Info className="h-4 w-4 animate-pulse" />
                                    Out of Balance by: <MoneyText value={totals.diff} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Narrations Area */}
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        <div className="col-span-8 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                <ArrowRightCircle className="h-3.5 w-3.5" />
                                Long Narration
                            </div>
                            <textarea
                                value={form.memo}
                                onChange={(e) => setForm(f => ({ ...f, memo: e.target.value }))}
                                placeholder="Explain this entire voucher in detail..."
                                className="min-h-[100px] w-full rounded-3xl border-slate-200 bg-white p-4 text-sm shadow-sm outline-none ring-indigo-500/10 focus:border-indigo-500 focus:ring-4 dark:border-slate-800 dark:bg-slate-900"
                            />
                        </div>
                        <div className="col-span-4 flex flex-col justify-end space-y-4">
                            <div className="rounded-3xl border border-dashed border-slate-200 p-4 bg-slate-50/50">
                                <div className="text-xs font-bold text-slate-400 mb-2">VOUCHER STATUS</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Balancing Status</span>
                                    {totals.balanced ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">BALANCED</span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">UNBALANCED</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    className="h-11 flex-1 rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                                    onClick={onSave}
                                    disabled={!totals.balanced}
                                >
                                    SAVE VOUCHER [F2]
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-11 px-8 rounded-2xl font-bold"
                                    onClick={() => router.back()}
                                >
                                    QUIT
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Sidebar for Quick Actions / Shortcuts - As per reference */}
                <div className="w-[300px] shrink-0 flex flex-col border-l bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm">
                    {/* Shortcut Keys Panel */}
                    <div className="p-6 flex flex-col flex-1 overflow-y-auto">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Shortcut Keys</h3>
                            <Keyboard className="h-4 w-4 text-slate-300" />
                        </div>

                        <div className="space-y-px overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            {[
                                { key: "F1", desc: "Help & Guide" },
                                { key: "F1", desc: "Add Account", mod: "Alt" },
                                { key: "F2", desc: "Save / Done" },
                                { key: "F3", desc: "Masters", mod: "Alt" },
                                { key: "F4", desc: "Standard Narration" },
                                { key: "F5", desc: "Payment Vch" },
                                { key: "F6", desc: "Receipt Vch" },
                                { key: "F7", desc: "Journal Vch" },
                                { key: "Ins", desc: "Add New Row" },
                                { key: "Del", desc: "Remove Row" },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors cursor-default border-b last:border-0 dark:hover:bg-slate-800">
                                    <span className="text-slate-500 font-medium">{s.desc}</span>
                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-tight text-slate-900 dark:bg-slate-800 dark:text-slate-200 uppercase">
                                        {s.mod && <span className="opacity-50 mr-1">{s.mod} +</span>}
                                        {s.key}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Recent History / Quick Reports Link Panel */}
                        <div className="mt-8">
                            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                                <History className="h-3.5 w-3.5" />
                                Related Reports
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { name: "Day Book", icon: "B" },
                                    { name: "Cash Book", icon: "C" },
                                    { name: "Trial Bal.", icon: "T" },
                                    { name: "Ledgers", icon: "L" },
                                    { name: "Grd Ledger", icon: "G" },
                                    { name: "Voucher List", icon: "V" },
                                ].map((r, i) => (
                                    <button key={i} className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-3 text-center transition-all hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                                        <span className="mb-1 text-[10px] font-black text-indigo-500 uppercase">{r.icon}</span>
                                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{r.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Help / Tip Panel */}
                        <div className="mt-auto pt-8">
                            <div className="rounded-3xl bg-indigo-600 p-5 text-white shadow-xl shadow-indigo-100">
                                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                                    <HelpCircle className="h-4 w-4" />
                                </div>
                                <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Power Tip</h4>
                                <p className="text-[11px] leading-relaxed opacity-90">
                                    Use the <code className="bg-white/20 px-1 rounded">Tab</code> key to navigate through rows quickly. Select <code className="bg-white/20 px-1 rounded">Dr</code> or <code className="bg-white/20 px-1 rounded">Cr</code> using the mouse or spacebar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Bar - Footer style from reference */}
            <div className="flex shrink-0 items-center justify-between border-t bg-slate-900 px-6 py-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <div className="flex gap-6">
                    <div className="flex gap-2">
                        <span className="text-slate-600">[Esc]-Quit</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-white">[F2]-Done</span>
                    </div>
                    <div className="flex gap-2 text-indigo-400">
                        <span>[F4]-Std. Nar.</span>
                    </div>
                    <div className="flex gap-2">
                        <span>[F7]-Repeat</span>
                    </div>
                </div>
                <div className="text-slate-500">
                    Lekhaly Enterprise Edition • V2026.1
                </div>
            </div>
        </div>
    );
}
