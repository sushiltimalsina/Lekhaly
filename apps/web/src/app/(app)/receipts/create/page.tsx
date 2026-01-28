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
    Send,
    Search,
    ChevronDown,
    Check,
    AlertCircle,
    ArrowDownLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

type ReceiptLine = {
    id: string;
    accountId: string;
    partyId: string;
    description: string;
    amount: string;
};

export default function ReceiptCreatePage() {
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
    });

    const [lines, setLines] = React.useState<ReceiptLine[]>([
        { id: Math.random().toString(), accountId: "", partyId: "", description: "", amount: "" },
    ]);

    React.useEffect(() => {
        listAccounts().then(setAccounts).catch(console.error);
        listParties().then(setParties).catch(console.error);
    }, []);

    const bankAccounts = React.useMemo(() => {
        // Filter for bank/cash accounts if possible, or show all
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

    const updateLine = (id: string, updates: Partial<ReceiptLine>) => {
        setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const onSave = async () => {
        if (!form.cashBankAccountId) {
            setError("Please select a Cash or Bank account.");
            return;
        }
        if (total <= 0) {
            setError("Total amount must be greater than zero.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Receipt Logic:
            // Line 1: DR Cash/Bank with Total
            // Other lines: CR respective accounts/parties
            const res = await createVoucherDraft({
                voucherType: "receipt",
                voucherDate: form.date.ad,
                voucherDateBs: form.date.bs,
                memo: form.memo,
                referenceNo: form.referenceNo,
                lines: [
                    {
                        accountId: form.cashBankAccountId,
                        debit: total,
                        credit: 0,
                        description: "Receipt: " + form.memo
                    },
                    ...lines
                        .filter(l => (l.accountId || l.partyId) && parseFloat(l.amount))
                        .map(l => ({
                            accountId: l.accountId || undefined,
                            partyId: l.partyId || undefined,
                            description: l.description,
                            debit: 0,
                            credit: parseFloat(l.amount) || 0,
                        }))
                ]
            });
            router.push(`/vouchers/${res.id}`);
        } catch (e: any) {
            setError(e?.message ?? "Failed to save receipt");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="New Money Receipt"
                description="Receive money from customers or other sources"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={onSave} disabled={loading || sending || total <= 0}>
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? "Saving..." : "Save Receipt"}
                        </Button>
                    </div>
                }
            />

            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Header Info */}
                <div className="lg:col-span-12 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="grid gap-6 sm:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Deposit To (Cash/Bank)</label>
                            <SearchableSelect<AccountRecord>
                                valueId={form.cashBankAccountId}
                                onChange={(id) => setForm(f => ({ ...f, cashBankAccountId: id }))}
                                options={bankAccounts}
                                placeholder="Select Cash/Bank"
                                buttonClassName="h-11 rounded-2xl bg-slate-50/60"
                            />
                        </div>
                        <div className="space-y-2">
                            <DualDateInput
                                label="Receipt Date"
                                value={form.date}
                                onChange={(date) => setForm(f => ({ ...f, date }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reference / Instrument No.</label>
                            <Input
                                value={form.referenceNo}
                                onChange={(e) => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                                placeholder="Cheque No / TXN ID"
                                className="h-11 rounded-2xl bg-slate-50/60"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Remarks</label>
                            <Input
                                value={form.memo}
                                onChange={(e) => setForm(f => ({ ...f, memo: e.target.value }))}
                                placeholder="Why is this being received?"
                                className="h-11 rounded-2xl bg-slate-50/60"
                            />
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="lg:col-span-12 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-bold uppercase tracking-tight text-slate-400">Received From</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-muted-foreground border-b border-slate-100 dark:border-slate-800">
                                    <th className="w-10 pb-3 text-left font-medium">#</th>
                                    <th className="pb-3 text-left font-medium">Payer (Party or Account)</th>
                                    <th className="pb-3 text-left font-medium">Description</th>
                                    <th className="w-48 pb-3 text-right font-medium">Amount</th>
                                    <th className="w-10 pb-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {lines.map((line, idx) => (
                                    <tr key={line.id}>
                                        <td className="py-4 text-muted-foreground">{idx + 1}</td>
                                        <td className="py-2 pr-4 min-w-[300px]">
                                            <div className="flex flex-col gap-2">
                                                <SearchableSelect<PartyRecord>
                                                    valueId={line.partyId}
                                                    onChange={(id) => updateLine(line.id, { partyId: id, accountId: "" })}
                                                    options={parties}
                                                    placeholder="Search Customer/Vendor..."
                                                    buttonClassName="h-10 rounded-xl"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">Or Account</span>
                                                    <SearchableSelect<AccountRecord>
                                                        valueId={line.accountId}
                                                        onChange={(id) => updateLine(line.id, { accountId: id, partyId: "" })}
                                                        options={accounts}
                                                        placeholder="Search General Account..."
                                                        buttonClassName="h-8 rounded-lg text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Input
                                                value={line.description}
                                                onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                                placeholder="e.g. Payment for INV-001"
                                                className="h-10 rounded-xl bg-slate-50/40"
                                            />
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Input
                                                type="number"
                                                value={line.amount}
                                                onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                                                placeholder="0.00"
                                                className="h-10 rounded-xl bg-white text-right font-semibold"
                                            />
                                        </td>
                                        <td className="py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLine(line.id)}
                                                disabled={lines.length <= 1}
                                                className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="py-6">
                                        <Button variant="ghost" size="sm" onClick={addLine} className="text-primary hover:bg-primary/5 rounded-full px-4 border border-dashed border-primary/30">
                                            <Plus className="mr-2 h-4 w-4" /> Add Another Item
                                        </Button>
                                    </td>
                                    <td className="py-6 pr-4">
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Receipt Amount</div>
                                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                                <MoneyText value={total} />
                                            </div>
                                        </div>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

