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
import SearchableSelect from "@/components/app/searchable-select";
import {
    Plus,
    Trash2,
    Save,
    Search,
    ChevronDown,
    Check,
    AlertCircle,
    ArrowUpRight,
    Keyboard,
    FileText,
    History,
    HelpCircle,
    X,
    ArrowRightCircle,
    Info,
    CreditCard
} from "lucide-react";
import { useRouter } from "next/navigation";

type PaymentLine = {
    id: string;
    accountId: string;
    partyId: string;
    description: string;
    amount: string;
};

export default function PaymentCreatePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [sending, setSending] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [parties, setParties] = React.useState<PartyRecord[]>([]);

    const [form, setForm] = React.useState({
        date: { bs: "", ad: "" },
        cashBankAccountId: "",
        memo: "",
        referenceNo: "",
        series: "Main",
        voucherNo: "NEW",
    });

    const [lines, setLines] = React.useState<PaymentLine[]>([
        { id: Math.random().toString(), accountId: "", partyId: "", description: "", amount: "" },
    ]);

    React.useEffect(() => {
        listAccounts().then(setAccounts).catch(console.error);
        listParties().then(setParties).catch(console.error);
    }, []);

    const bankAccounts = React.useMemo(() => {
        return accounts.filter(a => a.type === "asset");
    }, [accounts]);

    const total = React.useMemo(() => {
        return lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
    }, [lines]);

    const addLine = () => {
        setLines([...lines, { id: Math.random().toString(), accountId: "", partyId: "", description: "", amount: "" }]);
    };

    const removeLine = (id: string) => {
        if (lines.length <= 1) return;
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: string, updates: Partial<PaymentLine>) => {
        setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const onSave = async () => {
        if (!form.cashBankAccountId) {
            setError("Please select a Cash or Bank account to pay from.");
            return;
        }
        if (total <= 0) {
            setError("Total amount must be greater than zero.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await createVoucherDraft({
                voucherType: "payment",
                voucherDate: form.date.ad,
                voucherDateBs: form.date.bs,
                memo: form.memo,
                referenceNo: form.referenceNo,
                lines: [
                    {
                        accountId: form.cashBankAccountId,
                        debit: 0,
                        credit: total,
                        description: "Payment: " + form.memo
                    },
                    ...lines
                        .filter(l => (l.accountId || l.partyId) && parseFloat(l.amount))
                        .map(l => ({
                            accountId: l.accountId || undefined,
                            partyId: l.partyId || undefined,
                            description: l.description,
                            debit: parseFloat(l.amount) || 0,
                            credit: 0,
                        }))
                ]
            });
            router.push(`/vouchers/${res.id}`);
        } catch (e: any) {
            setError(e?.message ?? "Failed to save payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 font-sans">
            {/* Top Bar */}
            <div className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-3 dark:bg-slate-900/50 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/10 text-rose-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Add Cash Payment</h1>
                        <p className="text-xs text-muted-foreground">Voucher Series: <span className="font-semibold text-slate-700 dark:text-slate-300">{form.series}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl h-9">
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={loading || sending || total <= 0}
                        className="h-9 rounded-xl bg-rose-600 px-6 font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-700 dark:shadow-none"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? "Saving..." : "Save Payment [F2]"}
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
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-3">
                                <SearchableSelect<AccountRecord>
                                    label="Pay From (Cash/Bank)"
                                    valueId={form.cashBankAccountId}
                                    onChange={(id) => setForm(f => ({ ...f, cashBankAccountId: id }))}
                                    options={bankAccounts}
                                    placeholder="Select Cash/Bank account"
                                    buttonClassName="h-10 rounded-xl bg-slate-50/50"
                                />
                            </div>
                            <div className="col-span-3">
                                <DualDateInput
                                    label="Payment Date"
                                    value={form.date}
                                    onChange={(date) => setForm(f => ({ ...f, date }))}
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vch No.</label>
                                <Input
                                    value={form.voucherNo}
                                    readOnly
                                    className="h-10 rounded-xl bg-slate-50 border-slate-200 font-mono font-bold text-rose-600"
                                />
                            </div>
                            <div className="col-span-4 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reference / Instrument No.</label>
                                <Input
                                    value={form.referenceNo}
                                    onChange={(e) => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                                    placeholder="Cheque No / Transaction ID"
                                    className="h-10 rounded-xl border-slate-200 hover:border-slate-300 focus:ring-rose-500"
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
                                        <th className="px-4 py-3 text-left min-w-[300px]">Paid To (Vendor or Account)</th>
                                        <th className="px-4 py-3 text-left min-w-[250px]">Short Narration</th>
                                        <th className="w-48 px-4 py-3 text-right">Amount (Rs.)</th>
                                        <th className="w-10 px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {lines.map((line, idx) => (
                                        <tr key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-4 py-2.5 text-xs font-medium text-slate-400">{idx + 1}</td>
                                            <td className="px-2 py-2.5">
                                                <div className="flex flex-col gap-1.5">
                                                    <SearchableSelect<PartyRecord>
                                                        valueId={line.partyId}
                                                        onChange={(id) => updateLine(line.id, { partyId: id, accountId: "" })}
                                                        options={parties}
                                                        placeholder="Search Vendor/Customer..."
                                                        buttonClassName="h-9 rounded-xl border-slate-200 bg-transparent hover:bg-white"
                                                    />
                                                    <div className="flex items-center gap-2 px-1">
                                                        <span className="text-[9px] font-black uppercase text-slate-300">OR</span>
                                                        <SearchableSelect<AccountRecord>
                                                            valueId={line.accountId}
                                                            onChange={(id) => updateLine(line.id, { accountId: id, partyId: "" })}
                                                            options={accounts}
                                                            placeholder="Search Account..."
                                                            buttonClassName="h-7 rounded-lg border-slate-100 bg-slate-50/50 text-[11px] dark:bg-slate-800/40"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <Input
                                                    value={line.description}
                                                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                                    placeholder="Line note..."
                                                    className="h-9 rounded-xl border-slate-200 bg-transparent hover:bg-white focus:bg-white"
                                                />
                                            </td>
                                            <td className="px-2 py-2.5">
                                                <Input
                                                    type="number"
                                                    value={line.amount}
                                                    onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                                                    placeholder="0.00"
                                                    className="h-9 rounded-xl bg-white border-slate-200 text-right font-bold text-rose-600 focus:ring-rose-500"
                                                />
                                            </td>
                                            <td className="px-2 py-2.5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLine(line.id)}
                                                    disabled={lines.length <= 1}
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
                                        className="rounded-xl border-dashed border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-400 hover:bg-white h-9 px-4 transition-all"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Payee Row [Ins]
                                    </Button>
                                </div>
                                <div className="col-span-5 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Total Payment Amount</div>
                                <div className="col-span-3 text-right">
                                    <div className="text-xl font-black text-rose-600">
                                        <MoneyText value={total} />
                                    </div>
                                </div>
                                <div className="col-span-1"></div>
                            </div>
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
                                placeholder="Explain why this payment is being made..."
                                className="min-h-[100px] w-full rounded-3xl border-slate-200 bg-white p-4 text-sm shadow-sm outline-none ring-rose-500/10 focus:border-rose-500 focus:ring-4 dark:border-slate-800 dark:bg-slate-900"
                            />
                        </div>
                        <div className="col-span-4 flex flex-col justify-end space-y-4">
                            <div className="rounded-3xl border border-dashed border-slate-200 p-4 bg-slate-50/50">
                                <div className="text-xs font-bold text-slate-400 mb-2">VOUCHER SUMMARY</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Payee Count</span>
                                    <span className="text-sm font-bold text-slate-700">{lines.length} items</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm font-bold">Total (Rs.)</span>
                                    <span className="text-sm font-black text-rose-600"><MoneyText value={total} /></span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    className="h-11 flex-1 rounded-2xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-100 hover:bg-rose-700"
                                    onClick={onSave}
                                    disabled={total <= 0}
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

                {/* Right Sidebar */}
                <div className="w-[300px] shrink-0 flex flex-col border-l bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm">
                    <div className="p-6 flex flex-col flex-1 overflow-y-auto">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Shortcut Keys</h3>
                            <Keyboard className="h-4 w-4 text-slate-300" />
                        </div>

                        <div className="space-y-px overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            {[
                                { key: "F1", desc: "Help & Guide" },
                                { key: "F1", desc: "Add Vendor", mod: "Alt" },
                                { key: "F2", desc: "Save / Done" },
                                { key: "F3", desc: "Accounts", mod: "Alt" },
                                { key: "F5", desc: "Payment Vch" },
                                { key: "Ins", desc: "Add Row" },
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

                        <div className="mt-8">
                            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                                <History className="h-3.5 w-3.5" />
                                Recent Payments
                            </div>
                            <div className="space-y-2">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="p-3 rounded-2xl border bg-white text-xs hover:border-rose-200 cursor-pointer transition-all dark:bg-slate-900 dark:border-slate-800">
                                        <div className="flex justify-between font-bold mb-1">
                                            <span>P-00{9 - i}</span>
                                            <span className="text-rose-600">Rs. 4,200</span>
                                        </div>
                                        <div className="text-slate-400 truncate">Payment to Supplier ABC</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto pt-8">
                            <div className="rounded-3xl bg-rose-600 p-5 text-white shadow-xl shadow-rose-100">
                                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                                    <HelpCircle className="h-4 w-4" />
                                </div>
                                <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Payment Tip</h4>
                                <p className="text-[11px] leading-relaxed opacity-90">
                                    Always attach a reference number (Cheque/TXN) for bank payments to help in reconciliation later.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex shrink-0 items-center justify-between border-t bg-slate-900 px-6 py-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <div className="flex gap-6">
                    <div className="flex gap-2 text-slate-600">
                        <span>[Esc]-Quit</span>
                    </div>
                    <div className="flex gap-2 text-white">
                        <span>[F2]-Done</span>
                    </div>
                    <div className="flex gap-2 text-rose-400">
                        <span>[F5]-Payment</span>
                    </div>
                </div>
                <div className="text-slate-500">
                    Lekhaly Enterprise Edition • V2026.1
                </div>
            </div>
        </div>
    );
}
