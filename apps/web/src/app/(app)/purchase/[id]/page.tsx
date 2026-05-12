"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import {
    getVoucher,
    postVoucher,
    voidVoucher,
    listVoucherAttachments,
} from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay, getDateLabel } from "@/lib/dates/display";
import { ArrowLeft, Printer, MoreVertical, Trash2, CheckCircle2, Receipt, Building2, Calendar, FileText } from "lucide-react";
import { Button } from "@lekhaly/ui";
import { cn } from "@/lib/utils";

export default function PurchaseDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params?.id;
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [voucher, setVoucher] = React.useState<any>(null);
    const [attachments, setAttachments] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const [confirmPost, setConfirmPost] = React.useState(false);
    const [confirmVoid, setConfirmVoid] = React.useState(false);

    async function load() {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const v = await getVoucher(id);
            setVoucher(v);

            try {
                const a = await listVoucherAttachments(id);
                const list = Array.isArray(a) ? a : a?.items ?? a?.data ?? [];
                setAttachments(list);
            } catch {
                setAttachments([]);
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to load purchase");
            setVoucher(null);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        load();
    }, [id]);

    const status: DocStatus = (voucher?.status ?? "draft") as DocStatus;
    const voucherDate = getDateDisplay({ ad: voucher?.voucherDate, bs: voucher?.voucherDateBs, format: dateFormat });

    const totals = React.useMemo(() => {
        const lines: any[] = voucher?.lines ?? [];
        let dr = 0;
        for (const l of lines) {
            dr += Number(l.debit ?? 0);
        }
        return dr;
    }, [voucher]);

    async function onPost() {
        if (!id) return;
        setActionLoading(true);
        try {
            await postVoucher(id);
            setConfirmPost(false);
            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to post purchase");
        } finally {
            setActionLoading(false);
        }
    }

    async function onVoid() {
        if (!id) return;
        setActionLoading(true);
        try {
            await voidVoucher(id);
            setConfirmVoid(false);
            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to void purchase");
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading purchase details...</p>
            </div>
        </div>
    );

    if (!voucher) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <div className="text-xl font-semibold opacity-40">Purchase not found</div>
            <Button variant="outline" onClick={() => router.push("/purchase")} className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go back
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-xl shadow-slate-200/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/purchase")}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl border bg-white shadow-sm hover:bg-slate-50 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    {voucher?.voucherNumber || "Purchase Draft"}
                                </h1>
                                <StatusBadge status={status} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Purchase Invoice • Created on {new Date(voucher.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-full border-slate-200 dark:border-slate-800">
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        {status === "draft" && (
                            <Button
                                onClick={() => setConfirmPost(true)}
                                className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-6 shadow-lg shadow-slate-200 dark:shadow-none"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Post Purchase
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {error ? (
                    <div className="mb-6 rounded-xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-3xl border bg-white/90 p-8 shadow-sm dark:bg-slate-900/80">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs">
                                    <Receipt className="h-4 w-4" />
                                    Inventory Items
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    {voucher?.lines?.filter((l: any) => Number(l.debit) > 0).length || 0} items
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-muted-foreground border-b border-slate-50 dark:border-slate-800/50">
                                            <th className="text-left pb-4 font-semibold uppercase text-[10px] tracking-wider">Item Details</th>
                                            <th className="text-right pb-4 font-semibold uppercase text-[10px] tracking-wider">Qty</th>
                                            <th className="text-right pb-4 font-semibold uppercase text-[10px] tracking-wider">Rate</th>
                                            <th className="text-right pb-4 font-semibold uppercase text-[10px] tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {voucher?.lines?.map((l: any, idx: number) => {
                                            if (Number(l.credit) > 0) return null; // Skip liability line
                                            const qty = Number(l.qty || 0);
                                            const debit = Number(l.debit || 0);
                                            const rate = qty > 0 ? debit / qty : debit;
                                            return (
                                                <tr key={idx} className="group transition-colors">
                                                    <td className="py-5">
                                                        {l.itemId ? (
                                                            <Link href={`/reports/stock-ledger?itemId=${l.itemId}`} className="font-bold text-foreground hover:text-primary hover:underline">
                                                                {l.itemName || l.accountName || "Inventory Item"}
                                                            </Link>
                                                        ) : (
                                                            <div className="font-bold text-foreground">{l.accountName || "Inventory Item"}</div>
                                                        )}
                                                        <div className="text-xs text-muted-foreground mt-1">{l.description || "Purchase recorded"}</div>
                                                    </td>
                                                    <td className="py-5 text-right font-medium text-foreground">{qty || 1}</td>
                                                    <td className="py-5 text-right font-medium text-foreground">
                                                        <MoneyText value={rate} />
                                                    </td>
                                                    <td className="py-5 text-right font-bold text-foreground">
                                                        <MoneyText value={debit} />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {/* Total Row */}
                                        {voucher?.lines?.filter((l: any) => Number(l.debit) > 0).length > 0 && (
                                            <tr className="border-t-2 border-slate-100 dark:border-slate-800/80 font-bold bg-slate-50/30 dark:bg-slate-800/10">
                                                <td className="py-4 text-left uppercase text-[10px] tracking-wider text-muted-foreground">Total</td>
                                                <td className="py-4 text-right">
                                                    {voucher.lines.filter((l: any) => Number(l.debit) > 0).reduce((s: number, i: any) => s + Number(i.qty || 1), 0)}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <MoneyText value={voucher.lines.filter((l: any) => Number(l.debit) > 0).reduce((s: number, i: any) => {
                                                        const q = Number(i.qty || 1);
                                                        const d = Number(i.debit || 0);
                                                        return s + (d / q);
                                                    }, 0)} />
                                                </td>
                                                <td className="py-4 text-right">
                                                    <MoneyText value={voucher.lines.filter((l: any) => Number(l.debit) > 0).reduce((s: number, i: any) => s + Number(i.debit || 0), 0)} />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800/50 flex flex-col items-end">
                                <div className="w-full sm:w-80 space-y-4">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-foreground"><MoneyText value={totals} /></span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Tax (0%)</span>
                                        <span className="font-semibold text-foreground"><MoneyText value={0} /></span>
                                    </div>
                                    <div className="h-px bg-slate-50 dark:bg-slate-800/50 my-2" />
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-base font-bold text-foreground">Grand Total</span>
                                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-heading">
                                            <MoneyText value={totals} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-3xl border bg-white/90 p-8 shadow-sm dark:bg-slate-900/80">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Vendor & Schedule</div>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 shrink-0">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vendor</div>
                                        <div className="text-sm font-bold text-foreground mt-0.5">{voucher?.party?.name || "—"}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Date</div>
                                        <div className="text-sm font-bold text-foreground mt-0.5">{voucherDate.primary}</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{voucherDate.secondary}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border bg-slate-50/50 p-6 dark:bg-slate-800/20">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">
                                <FileText className="h-3 w-3" />
                                Memo
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 text-sm text-muted-foreground border border-slate-100 dark:border-slate-800 leading-relaxed shadow-sm italic">
                                {voucher?.memo || "No memo provided for this purchase."}
                            </div>
                        </div>

                        {status !== "void" && (
                            <Button
                                variant="outline"
                                onClick={() => setConfirmVoid(true)}
                                className="w-full rounded-2xl h-12 border-red-100/50 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all font-semibold dark:border-red-900/20 dark:hover:bg-red-900/10"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Void Purchase
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmPost}
                title="Post Purchase?"
                description="Posting will finalize the purchase, update your ledgers and stock levels. This action generates accounting entries."
                confirmText="Post Purchase"
                onConfirm={onPost}
                onCancel={() => setConfirmPost(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmVoid}
                title="Void Purchase?"
                description="Voiding will revert the accounting entries. This action is irreversible."
                confirmText="Void Purchase"
                variant="danger"
                onConfirm={onVoid}
                onCancel={() => setConfirmVoid(false)}
                loading={actionLoading}
            />
        </div>
    );
}
