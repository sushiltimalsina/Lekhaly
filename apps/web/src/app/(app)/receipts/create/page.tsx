"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    Info,
    User,
    Book,
    Wallet,
    Printer
} from "lucide-react";
import SearchableSelect from "@/components/app/searchable-select";
import { useRouter } from "next/navigation";

type ReceiptLine = {
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

export default function ReceiptCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [recentVouchers, setRecentVouchers] = React.useState<VoucherRecord[]>([]);
    const [showHistory, setShowHistory] = React.useState(false);

    const [form, setForm] = React.useState({
        date: { bs: "", ad: "" },
        memo: "",
        referenceNo: "",
        voucherNo: "NEW",
    });

    const dateRef = React.useRef<HTMLInputElement>(null);
    const referenceNoRef = React.useRef<HTMLInputElement>(null);
    const memoRef = React.useRef<HTMLTextAreaElement>(null);
    const addRowButtonRef = React.useRef<HTMLButtonElement>(null);
    const saveButtonRef = React.useRef<HTMLButtonElement>(null);

    const rowRefs = React.useRef<{
        typeToggle: (HTMLButtonElement | null)[];
        select: (HTMLButtonElement | null)[];
        amount: (HTMLInputElement | null)[];
        narration: (HTMLInputElement | null)[];
    }>({ typeToggle: [], select: [], amount: [], narration: [] });

    const safeFocus = (el: HTMLElement | null) => {
        if (!el) return;
        el.focus({ preventScroll: true });
    };

    const [lines, setLines] = React.useState<ReceiptLine[]>([
        { id: Math.random().toString(), type: "dr", accountId: "", partyId: "", description: "", amount: "" },
        { id: Math.random().toString(), type: "cr", accountId: "", partyId: "", description: "", amount: "" },
    ]);

    // Clean up refs when lines change
    React.useEffect(() => {
        rowRefs.current.typeToggle = rowRefs.current.typeToggle.slice(0, lines.length);
        rowRefs.current.select = rowRefs.current.select.slice(0, lines.length);
        rowRefs.current.amount = rowRefs.current.amount.slice(0, lines.length);
        rowRefs.current.narration = rowRefs.current.narration.slice(0, lines.length);
    }, [lines.length]);

    React.useEffect(() => {
        const timer = setTimeout(() => safeFocus(dateRef.current), 100);
        return () => clearTimeout(timer);
    }, []);

    React.useEffect(() => {
        listAccounts().then(setAccounts).catch(console.error);
        listParties().then(setParties).catch(console.error);
        listVouchers({ type: "receipt", take: 5 }).then(setRecentVouchers).catch(console.error);
    }, []);

    const ledgerOptions = React.useMemo<LedgerOption[]>(() => {
        const accs = accounts.map(a => ({
            id: a.id,
            name: a.name,
            type: "account" as const,
            category: a.type
        }));
        const pts = parties.map(p => ({
            id: p.id,
            name: p.name,
            type: "party" as const,
            category: p.type
        }));
        return [...accs, ...pts];
    }, [accounts, parties]);

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
        const newIdx = lines.length;
        setLines([...lines, { id: Math.random().toString(), type: lastType, accountId: "", partyId: "", description: "", amount: "" }]);
        setTimeout(() => safeFocus(rowRefs.current.typeToggle[newIdx]), 50);
    };

    const removeLine = (id: string) => {
        if (lines.length <= 2) return;
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: string, updates: Partial<ReceiptLine>) => {
        setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const onSave = async () => {
        if (!totals.balanced) {
            setError("Receipt must be balanced.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await createVoucherDraft({
                voucherType: "receipt",
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
            router.push(`/vouchers/${res.id}`);
        } catch (e: any) {
            setError(e?.message ?? "Failed to save receipt");
        } finally {
            setLoading(false);
        }
    };

    const onPrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 font-sans transition-colors duration-300 relative min-h-full pb-12">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/20">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold italic tracking-tight text-slate-900 dark:text-slate-100">Money Receipt</h1>
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Record incoming funds</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHistory(!showHistory)}
                            className={cn(
                                "rounded-xl border-slate-200 h-9 px-4 gap-2 transition-all",
                                showHistory && "bg-emerald-50 border-emerald-200 text-emerald-600"
                            )}
                        >
                            <History className="h-4 w-4" />
                            Recent
                        </Button>
                        <div className="w-px h-6 bg-slate-200 mx-1" />
                        <Button variant="outline" size="sm" onClick={() => router.back()} className="rounded-xl border-slate-200 h-9">
                            Cancel
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {error && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 trasition-all">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 backdrop-blur-sm">
                            <div className="flex flex-wrap gap-12">
                                <div className="w-[280px]">
                                    <DualDateInput
                                        ref={dateRef}
                                        label="Voucher Date"
                                        value={form.date}
                                        accentColor="bg-emerald-600"
                                        onChange={(date) => setForm(f => ({ ...f, date }))}
                                        onEnterNext={() => safeFocus(referenceNoRef.current)}
                                    />
                                    <div className="text-[9px] text-slate-400 italic px-1 pt-1">
                                        Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[8px] not-italic font-sans">Enter</kbd> for today
                                    </div>
                                </div>
                                <div className="w-[180px] space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Vch No.</label>
                                    <Input
                                        value={form.voucherNo}
                                        readOnly
                                        className="h-10 rounded-xl bg-slate-50 border-slate-200 font-mono font-bold text-emerald-600 dark:bg-slate-950 dark:border-slate-800 text-center"
                                    />
                                </div>
                                <div className="w-[220px] space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Reference No.</label>
                                    <Input
                                        ref={referenceNoRef}
                                        value={form.referenceNo}
                                        onChange={(e) => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                                        placeholder="Ref / Chq No."
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                safeFocus(rowRefs.current.typeToggle[0]);
                                            }
                                        }}
                                        className="h-10 rounded-xl border-slate-200 hover:border-emerald-400 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 transition-all font-medium"
                                    />
                                    <div className="text-[9px] text-slate-400 italic px-1 pt-1">
                                        Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[8px] not-italic font-sans">Enter</kbd> to jump to items
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-100 bg-white/50 dark:border-slate-800/50 dark:bg-slate-900/20 overflow-hidden backdrop-blur-sm">
                            <div className="overflow-x-auto scrollbar-none">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-[60px]">#</th>
                                            <th className="px-2 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-[80px]">D/C</th>
                                            <th className="px-2 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-[400px]">Account/Party Detail</th>
                                            <th className="px-2 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-[180px]">Debit (To)</th>
                                            <th className="px-2 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-[180px]">Credit (From)</th>
                                            <th className="px-2 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Note</th>
                                            <th className="px-6 py-4 w-[60px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        <tr className="bg-white/30 dark:bg-transparent">
                                            <td colSpan={7} className="px-6 py-1.5">
                                                <div className="flex gap-4 text-[9px] text-slate-400 italic">
                                                    <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[8px] not-italic font-sans">Space</kbd> to toggle D/C</span>
                                                    <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[8px] not-italic font-sans">Shift + Enter</kbd> in Note to jump to Memo</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {lines.map((line, idx) => (
                                            <tr key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-emerald-900/5 transition-colors duration-200">
                                                <td className="px-6 py-3 text-xs font-bold text-slate-300 dark:text-slate-600">{idx + 1}</td>
                                                <td className="px-2 py-3">
                                                    <button
                                                        ref={(el) => { rowRefs.current.typeToggle[idx] = el; }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            updateLine(line.id, { type: line.type === "dr" ? "cr" : "dr" });
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                safeFocus(rowRefs.current.select[idx]);
                                                            } else if (e.key === " ") {
                                                                e.preventDefault();
                                                                updateLine(line.id, { type: line.type === "dr" ? "cr" : "dr" });
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-full h-9 rounded-lg text-[10px] font-black transition-all transform active:scale-90 flex items-center justify-center border-2 outline-none focus:ring-2 focus:ring-offset-1",
                                                            line.type === "dr"
                                                                ? "bg-blue-600 border-blue-500 text-white shadow-sm focus:ring-blue-500"
                                                                : "bg-rose-600 border-rose-500 text-white shadow-sm focus:ring-rose-500"
                                                        )}
                                                    >
                                                        {line.type.toUpperCase()}
                                                    </button>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <SearchableSelect<LedgerOption>
                                                        buttonRef={(el) => { rowRefs.current.select[idx] = el; }}
                                                        valueId={line.accountId || line.partyId}
                                                        onChange={(id, opt) => {
                                                            if (opt?.type === "account") {
                                                                updateLine(line.id, { accountId: id, partyId: "" });
                                                            } else {
                                                                updateLine(line.id, { partyId: id, accountId: "" });
                                                            }
                                                        }}
                                                        onEnterNext={() => safeFocus(rowRefs.current.amount[idx])}
                                                        options={ledgerOptions}
                                                        getLabel={(opt) => opt.name}
                                                        placeholder="Search Ledger..."
                                                        className="w-full"
                                                        buttonClassName="h-9 rounded-xl border-slate-200 bg-transparent hover:bg-white dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300 transition-all"
                                                        leftIcon={
                                                            lines.find(l => l.id === line.id)?.partyId ? (
                                                                <User className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Book className="h-3.5 w-3.5" />
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <Input
                                                        ref={(el) => { if (line.type === "dr") rowRefs.current.amount[idx] = el; }}
                                                        type="number"
                                                        value={line.type === "dr" ? line.amount : ""}
                                                        disabled={line.type !== "dr"}
                                                        onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                                                        placeholder="0.00"
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                if (line.amount) {
                                                                    safeFocus(rowRefs.current.narration[idx]);
                                                                }
                                                            }
                                                        }}
                                                        className={cn(
                                                            "h-9 rounded-xl text-right font-black transition-all border-2",
                                                            line.type === "dr"
                                                                ? "bg-white border-blue-100 focus:border-blue-500 dark:bg-slate-950 dark:border-blue-900/30"
                                                                : "bg-slate-50/50 border-transparent text-transparent dark:bg-slate-900/50"
                                                        )}
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <Input
                                                        ref={(el) => { if (line.type === "cr") rowRefs.current.amount[idx] = el; }}
                                                        type="number"
                                                        value={line.type === "cr" ? line.amount : ""}
                                                        disabled={line.type !== "cr"}
                                                        onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                                                        placeholder="0.00"
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                if (line.amount) {
                                                                    safeFocus(rowRefs.current.narration[idx]);
                                                                }
                                                            }
                                                        }}
                                                        className={cn(
                                                            "h-9 rounded-xl text-right font-black transition-all border-2",
                                                            line.type === "cr"
                                                                ? "bg-white border-rose-100 focus:border-rose-500 dark:bg-slate-950 dark:border-rose-900/30"
                                                                : "bg-slate-50/50 border-transparent text-transparent dark:bg-slate-900/50"
                                                        )}
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <Input
                                                        ref={(el) => { rowRefs.current.narration[idx] = el; }}
                                                        value={line.description}
                                                        onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                                        placeholder="Short description..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                if (e.shiftKey) {
                                                                    e.preventDefault();
                                                                    safeFocus(memoRef.current);
                                                                    return;
                                                                }
                                                                e.preventDefault();
                                                                if (rowRefs.current.typeToggle[idx + 1]) {
                                                                    safeFocus(rowRefs.current.typeToggle[idx + 1]);
                                                                } else {
                                                                    safeFocus(addRowButtonRef.current);
                                                                }
                                                            }
                                                        }}
                                                        className="h-9 rounded-xl border-slate-200 bg-transparent hover:bg-white focus:bg-white dark:border-slate-800 dark:hover:bg-slate-900 dark:focus:bg-slate-900 dark:text-slate-300 transition-all font-medium"
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeLine(line.id)}
                                                        disabled={lines.length <= 2}
                                                        className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all rounded-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50/30 dark:bg-slate-800/20 shadow-inner">
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4">
                                                <Button
                                                    ref={addRowButtonRef}
                                                    variant="outline"
                                                    onClick={addLine}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            addLine();
                                                        } else if (e.key === "Tab" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            safeFocus(memoRef.current);
                                                        }
                                                    }}
                                                    className="h-10 rounded-xl border-dashed border-emerald-200 text-emerald-500 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 dark:border-emerald-900/50 transition-all font-bold px-6"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add New Row
                                                </Button>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 mb-12">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                        <ArrowRightCircle className="h-3.5 w-3.5" />
                                        General Memo / Long Narration
                                    </div>
                                    <div className="text-[9px] text-slate-400 italic">
                                        Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[8px] not-italic font-sans">Shift + Enter</kbd> to jump to Save
                                    </div>
                                </div>
                                <textarea
                                    ref={memoRef}
                                    value={form.memo}
                                    onChange={(e) => setForm(f => ({ ...f, memo: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey)) {
                                            e.preventDefault();
                                            safeFocus(saveButtonRef.current);
                                        }
                                    }}
                                    placeholder="Add overall remarks for this receipt..."
                                    className="min-h-[120px] w-full rounded-2xl border-2 border-slate-100 bg-slate-50/30 p-5 text-sm outline-none ring-emerald-500/10 focus:border-emerald-500 focus:bg-white focus:ring-4 dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950 dark:text-slate-300 transition-all font-medium leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Static Action Footer */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8 pb-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-wrap items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total In</span>
                            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                                <MoneyText value={totals.dr} />
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-10 bg-slate-100 dark:bg-slate-800" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Out</span>
                            <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                                <MoneyText value={totals.cr} />
                            </div>
                        </div>

                        {!totals.balanced && totals.dr > 0 && (
                            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-2 rounded-2xl">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Difference</span>
                                    <span className="text-sm font-black text-red-600 dark:text-red-400 leading-none"><MoneyText value={totals.diff} /></span>
                                </div>
                            </div>
                        )}
                        {totals.balanced && totals.dr > 0 && (
                            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-2 rounded-2xl">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Status</span>
                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">BALANCED</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                            ref={saveButtonRef}
                            onClick={onSave}
                            disabled={loading || !totals.balanced}
                            className={cn(
                                "flex-1 md:flex-none rounded-2xl h-12 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all",
                                totals.balanced
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-emerald-500/25"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50 shadow-none"
                            )}
                        >
                            {loading ? "Saving..." : "Save Receipt"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onPrint}
                            className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>
            </div>

            {/* History Drawer */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-[360px] bg-white border-l border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-2xl transition-transform duration-500 z-[60] transform",
                    showHistory ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full bg-slate-50/30 dark:bg-slate-900/50">
                    <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                <History className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                History
                            </h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <X className="h-5 w-5 text-slate-400" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
                        {recentVouchers.length === 0 ? (
                            <div className="text-center py-20 opacity-20 dark:opacity-10">
                                <History className="h-16 w-16 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No entries yet</p>
                            </div>
                        ) : (
                            recentVouchers.map((v) => (
                                <div key={v.id} onClick={() => router.push(`/vouchers/${v.id}`)} className="p-5 rounded-3xl border border-white bg-white shadow-sm hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800 group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg w-max mb-2 uppercase tracking-tight">#{v.voucherNo}</span>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{v.voucherDateBs}</span>
                                        </div>
                                        <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                                            <MoneyText value={v.amount} />
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic border-t border-slate-50/50 dark:border-slate-700 pt-3">{v.memo || "No description provided"}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
