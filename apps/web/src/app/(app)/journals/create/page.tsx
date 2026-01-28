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
    Send,
    Search,
    ChevronDown,
    Check,
    AlertCircle,
} from "lucide-react";
import SearchableSelect from "@/components/app/searchable-select";
import { useRouter } from "next/navigation";

type JournalLine = {
    id: string;
    accountId: string;
    partyId: string;
    description: string;
    debit: string;
    credit: string;
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
    });

    const [lines, setLines] = React.useState<JournalLine[]>([
        { id: Math.random().toString(), accountId: "", partyId: "", description: "", debit: "", credit: "" },
        { id: Math.random().toString(), accountId: "", partyId: "", description: "", debit: "", credit: "" },
    ]);

    React.useEffect(() => {
        listAccounts().then(setAccounts).catch(console.error);
        listParties().then(setParties).catch(console.error);
    }, []);

    const totals = React.useMemo(() => {
        const dr = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
        const cr = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
        return { dr, cr, balanced: Math.abs(dr - cr) < 0.01 && dr > 0 };
    }, [lines]);

    const addLine = () => {
        setLines([...lines, { id: Math.random().toString(), accountId: "", partyId: "", description: "", debit: "", credit: "" }]);
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
                    .filter(l => l.accountId && (parseFloat(l.debit) || parseFloat(l.credit)))
                    .map(l => ({
                        accountId: l.accountId,
                        partyId: l.partyId || undefined,
                        description: l.description,
                        debit: parseFloat(l.debit) || 0,
                        credit: parseFloat(l.credit) || 0,
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
        <div className="space-y-6 pb-20">
            <PageHeader
                title="New Journal Voucher"
                description="Record general ledger transactions"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={onSave} disabled={loading || sending || !totals.balanced}>
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? "Saving..." : "Save Draft"}
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
                {/* Master Info */}
                <div className="lg:col-span-12 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="space-y-2">
                            <DualDateInput
                                label="Voucher Date"
                                value={form.date}
                                onChange={(date) => setForm(f => ({ ...f, date }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reference No.</label>
                            <Input
                                value={form.referenceNo}
                                onChange={(e) => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                                placeholder="Ref / Cheque No."
                                className="h-11 rounded-2xl bg-slate-50/60"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-3 lg:col-span-1">
                            <label className="text-sm font-medium">Notes / General Memo</label>
                            <Input
                                value={form.memo}
                                onChange={(e) => setForm(f => ({ ...f, memo: e.target.value }))}
                                placeholder="Purpose of this journal..."
                                className="h-11 rounded-2xl bg-slate-50/60"
                            />
                        </div>
                    </div>
                </div>

                {/* Lines */}
                <div className="lg:col-span-12 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-muted-foreground">
                                    <th className="w-10 pb-3 text-left">#</th>
                                    <th className="pb-3 text-left">Account</th>
                                    <th className="pb-3 text-left">Description</th>
                                    <th className="w-40 pb-3 text-right">Debit</th>
                                    <th className="w-40 pb-3 text-right">Credit</th>
                                    <th className="w-10 pb-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {lines.map((line, idx) => (
                                    <tr key={line.id}>
                                        <td className="py-3 text-muted-foreground">{idx + 1}</td>
                                        <td className="py-2 pr-4 min-w-[250px]">
                                            <SearchableSelect<AccountRecord>
                                                valueId={line.accountId}
                                                onChange={(id) => updateLine(line.id, { accountId: id })}
                                                options={accounts}
                                                placeholder="Select Account"
                                                className="w-full"
                                                buttonClassName="h-10 rounded-xl"
                                            />
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Input
                                                value={line.description}
                                                onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                                placeholder="Description"
                                                className="h-10 rounded-xl bg-slate-50/40"
                                            />
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Input
                                                type="number"
                                                value={line.debit}
                                                onChange={(e) => updateLine(line.id, { debit: e.target.value, credit: "" })}
                                                placeholder="0.00"
                                                className="h-10 rounded-xl bg-white text-right"
                                            />
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Input
                                                type="number"
                                                value={line.credit}
                                                onChange={(e) => updateLine(line.id, { credit: e.target.value, debit: "" })}
                                                placeholder="0.00"
                                                className="h-10 rounded-xl bg-white text-right"
                                            />
                                        </td>
                                        <td className="py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLine(line.id)}
                                                disabled={lines.length <= 2}
                                                className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-100 dark:border-slate-800">
                                    <td colSpan={3} className="py-4">
                                        <Button variant="ghost" size="sm" onClick={addLine} className="text-primary hover:bg-primary/5">
                                            <Plus className="mr-2 h-4 w-4" /> Add Line
                                        </Button>
                                    </td>
                                    <td className="py-4 pr-4 text-right font-bold text-lg">
                                        <MoneyText value={totals.dr} />
                                    </td>
                                    <td className="py-4 pr-4 text-right font-bold text-lg">
                                        <MoneyText value={totals.cr} />
                                    </td>
                                    <td></td>
                                </tr>
                                {!totals.balanced && totals.dr > 0 && (
                                    <tr>
                                        <td colSpan={6} className="pb-4 text-right text-xs text-red-600 font-medium">
                                            Difference: <MoneyText value={Math.abs(totals.dr - totals.cr)} />
                                        </td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}


