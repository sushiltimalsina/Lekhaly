"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import BsDateInput from "@/components/app/bs-date-input";
import { createVoucherDraft, type VoucherDraftInput } from "@/lib/api/vouchers";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listItems, type ItemRecord } from "@/lib/api/items";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Save, Send, Search, Receipt, ArrowRight, Building2, Calculator } from "lucide-react";
import { toBs } from "@/lib/dates/bs";

type Line = {
    itemId: string;
    qty: string;
    rate: string;
    description?: string;
    expenseAccountId?: string;
};

export default function PurchaseCreatePage() {
    const [mounted, setMounted] = React.useState(false);
    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [items, setItems] = React.useState<ItemRecord[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        partyId: "",
        payableAccountId: "",
        date: { bs: "", ad: "" },
        referenceNo: "",
        memo: "",
        notes: "",
    });

    const [lines, setLines] = React.useState<Line[]>([
        { itemId: "", qty: "1", rate: "" },
    ]);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        const now = new Date();
        const ad = now.toISOString().slice(0, 10);
        const bs = toBs(ad);
        setForm((f) => ({ ...f, date: { bs, ad } }));
    }, []);

    React.useEffect(() => {
        let alive = true;
        const normalizeList = <T,>(input: unknown): T[] => {
            if (Array.isArray(input)) return input as T[];
            const obj = input as { items?: T[]; data?: T[] } | null;
            return obj?.items ?? obj?.data ?? [];
        };

        Promise.all([
            listParties({ type: "supplier", take: 100 }),
            listAccounts({ type: "liability", take: 200 }),
            listItems({ take: 500 }),
        ])
            .then(([p, a, i]) => {
                if (!alive) return;
                setParties(normalizeList<PartyRecord>(p));
                setAccounts(normalizeList<AccountRecord>(a));
                setItems(normalizeList<ItemRecord>(i));
            })
            .catch((e: any) => {
                if (!alive) return;
                setError(e?.message ?? "Failed to load data.");
            });
        return () => { alive = false; };
    }, []);

    const updateLine = (idx: number, patch: Partial<Line>) => {
        setLines((prev) =>
            prev.map((l, i) => {
                if (i !== idx) return l;
                const next = { ...l, ...patch };
                if (patch.itemId) {
                    const item = items.find(it => it.id === patch.itemId);
                    if (item) {
                        next.rate = String(item.purchasePrice || "");
                        next.expenseAccountId = item.expenseAccountId || undefined;
                    }
                }
                return next;
            })
        );
    };

    const addLine = () => setLines((prev) => [...prev, { itemId: "", qty: "1", rate: "" }]);
    const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

    const subtotal = lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.rate || 0), 0);
    const total = subtotal;

    const onSave = async () => {
        setError(null);
        setSuccess(null);

        if (!form.partyId) { setError("Please select a vendor."); return; }
        if (!form.payableAccountId) { setError("Please select a payable account."); return; }

        const validLines = lines.filter(l => l.itemId && Number(l.qty) > 0);
        if (validLines.length === 0) { setError("Add at least one item."); return; }

        setLoading(true);
        try {
            const voucherLines = validLines.map(l => ({
                accountId: l.expenseAccountId || "",
                itemId: l.itemId,
                description: l.description || "Purchase",
                debit: Number(l.qty) * Number(l.rate),
                qty: Number(l.qty),
            }));

            // Add credit line for payable
            voucherLines.push({
                accountId: form.payableAccountId,
                debit: 0,
                credit: total,
            } as any);

            const payload: VoucherDraftInput = {
                voucherType: "purchase",
                voucherDate: form.date.ad,
                voucherDateBs: form.date.bs,
                partyId: form.partyId,
                memo: form.memo || `Purchase from vendor`,
                lines: voucherLines as any,
            };

            const res: any = await createVoucherDraft(payload);
            setSuccess(`Purchase draft created successfully!`);
        } catch (e: any) {
            setError(e?.message ?? "Failed to save purchase.");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return <div className="min-h-screen" />;

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-xl shadow-slate-200/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20">
                <PageHeader
                    title="New Purchase Invoice"
                    description="Record a new bill or purchase from your vendor."
                    actions={<div className="text-xs text-muted-foreground">Actions are at the bottom</div>}
                />

                {/* alerts */}
                <div className="mb-4 grid gap-3">
                    {error ? (
                        <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}
                    {success ? (
                        <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">
                            {success}
                        </div>
                    ) : null}
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Vendor + Dates */}
                        <div className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-sm font-semibold">Vendor</div>
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="rounded-full border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    New Vendor
                                </Button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-1 text-sm sm:col-span-2">
                                    <span className="text-muted-foreground">Select vendor</span>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <select
                                            value={form.partyId}
                                            onChange={(e) => setForm((f) => ({ ...f, partyId: e.target.value }))}
                                            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            <option value="">Select vendor</option>
                                            {parties.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </label>

                                <label className="space-y-1 text-sm sm:col-span-2">
                                    <BsDateInput
                                        label="Invoice Date"
                                        valueBs={form.date.bs}
                                        valueAd={form.date.ad}
                                        onChange={(next) => setForm((f) => ({ ...f, date: next }))}
                                    />
                                </label>

                                <label className="space-y-1 text-sm sm:col-span-2">
                                    <span className="text-muted-foreground">Reference No.</span>
                                    <Input
                                        value={form.referenceNo}
                                        onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                                        placeholder="Enter reference (optional)"
                                    />
                                </label>

                                <label className="space-y-1 text-sm sm:col-span-2">
                                    <span className="text-muted-foreground">Payable Account</span>
                                    <select
                                        value={form.payableAccountId}
                                        onChange={(e) => setForm((f) => ({ ...f, payableAccountId: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <option value="">Select account</option>
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>{a.code ? `${a.code} - ${a.name}` : a.name}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-sm font-semibold">Items</div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addLine}
                                    className="rounded-full px-4 bg-white/70 dark:bg-white/10"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add item
                                </Button>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/40">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-100/80 dark:bg-slate-800/60">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs text-muted-foreground">Item</th>
                                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">Qty</th>
                                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">Rate</th>
                                            <th className="px-3 py-2 text-right text-xs text-muted-foreground">Amount</th>
                                            <th className="px-3 py-2 text-right text-xs text-muted-foreground" />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {lines.map((line, idx) => {
                                            const qty = Number(line.qty || 0);
                                            const rate = Number(line.rate || 0);
                                            const amt = qty * rate;

                                            return (
                                                <tr key={idx} className="border-t border-slate-200/70 dark:border-slate-700/70">
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={line.itemId}
                                                            onChange={(e) => updateLine(idx, { itemId: e.target.value })}
                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                        >
                                                            <option value="">Select item</option>
                                                            {items.map((it) => (
                                                                <option key={it.id} value={it.id}>{it.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    <td className="px-3 py-2 text-right">
                                                        <Input
                                                            type="number"
                                                            value={line.qty}
                                                            onChange={(e) => updateLine(idx, { qty: e.target.value })}
                                                            className="text-right"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-2 text-right">
                                                        <Input
                                                            type="number"
                                                            value={line.rate}
                                                            onChange={(e) => updateLine(idx, { rate: e.target.value })}
                                                            className="text-right"
                                                        />
                                                    </td>

                                                    <td className="px-3 py-2 text-right">
                                                        <MoneyText value={amt} />
                                                    </td>

                                                    <td className="px-3 py-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLine(idx)}
                                                            className={cn(
                                                                "inline-flex items-center justify-center rounded-md border px-2 py-2 text-xs text-red-600 hover:bg-red-50",
                                                                lines.length === 1 && "pointer-events-none opacity-50"
                                                            )}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        <tr className="border-t bg-slate-100/60 dark:bg-slate-800/40">
                                            <td className="px-3 py-2 text-right font-medium" colSpan={3}>Total</td>
                                            <td className="px-3 py-2 text-right font-semibold">
                                                <MoneyText value={subtotal} />
                                            </td>
                                            <td />
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Memo */}
                        <div className="rounded-3xl border bg-white/90 p-6 shadow-sm space-y-5 dark:bg-slate-900/80">
                            <div className="text-sm font-semibold">Memo</div>
                            <Input
                                value={form.memo}
                                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                                placeholder="What is this purchase for?"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <aside className="rounded-3xl border bg-white/90 p-6 shadow-sm space-y-5 dark:bg-slate-900/80">
                        <div className="text-sm font-semibold">Summary</div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <MoneyText value={subtotal} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <MoneyText value={0} />
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-200/70 to-slate-100/40 px-3 py-2 font-semibold dark:from-slate-800/60 dark:to-slate-700/30 font-heading">
                                <span>Total</span>
                                <MoneyText value={total} />
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="text-xs text-muted-foreground">Invoice Date</div>
                            <div className="flex items-baseline justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                                <div className="text-sm font-semibold">{form.date.bs || "—"}</div>
                                <div className="text-xs text-muted-foreground">({form.date.ad || "—"})</div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="text-xs text-muted-foreground">Additional notes</div>
                            <Input
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                placeholder="Additional notes..."
                            />
                        </div>
                    </aside>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => window.history.back()}
                        className="rounded-full px-6 bg-white/70 dark:bg-white/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={loading}
                        className="rounded-full px-8 bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 dark:shadow-none transition-all"
                    >
                        {loading ? "Saving..." : "Save Draft"}
                        <Save className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
