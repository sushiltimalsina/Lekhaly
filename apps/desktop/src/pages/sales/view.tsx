"use client";

import * as React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import { getInvoice, postInvoice, voidInvoice } from "@/lib/api/invoices";
import { generateInvoicePdf, getPdfJobUrl } from "@/lib/api/pdf";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay, getDateLabel } from "@/lib/dates/display";
import { ArrowLeft, Printer, MoreVertical, Trash2, CheckCircle2, Receipt, Building2, Calendar, FileText, Download } from "lucide-react";
import { Button } from "@lekhaly/ui";
import { cn } from "@/lib/utils";

export default function SalesDetailPage() {
    const params = useParams();
    const navigate = useNavigate();
    const id = params?.id;
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [invoice, setInvoice] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [confirmPost, setConfirmPost] = React.useState(false);
    const [confirmVoid, setConfirmVoid] = React.useState(false);

    async function load() {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getInvoice(id);
            setInvoice(res);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load invoice");
            setInvoice(null);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        load();
    }, [id]);

    const status: DocStatus = (invoice?.status ?? "draft") as DocStatus;
    const invoiceDate = getDateDisplay({ ad: invoice?.date, bs: invoice?.dateBs, format: dateFormat });
    const dueDate = getDateDisplay({ ad: invoice?.dueDate, bs: invoice?.dueDateBs, format: dateFormat });

    async function onPost() {
        if (!id) return;
        setActionLoading(true);
        try {
            await postInvoice(id);
            setConfirmPost(false);
            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to post invoice");
        } finally {
            setActionLoading(false);
        }
    }

    async function onVoid() {
        if (!id) return;
        setActionLoading(true);
        try {
            await voidInvoice(id);
            setConfirmVoid(false);
            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to void invoice");
        } finally {
            setActionLoading(false);
        }
    }

    async function onPdf() {
        if (!id) return;
        setActionLoading(true);
        setError(null);
        try {
            const job: any = await generateInvoicePdf(id);
            const jobId = job?.id ?? job?.jobId ?? job?.pdfJobId;
            if (!jobId) throw new Error("PDF job id not returned by server");

            const urlRes: any = await getPdfJobUrl(jobId);
            const url = urlRes?.url ?? urlRes?.signedUrl ?? urlRes;
            if (!url) throw new Error("PDF URL not returned by server");

            window.open(url, "_blank", "noopener,noreferrer");
        } catch (e: any) {
            setError(e?.message ?? "Failed to generate PDF");
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading invoice details...</p>
            </div>
        </div>
    );

    if (!invoice) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <div className="text-xl font-semibold opacity-40">Invoice not found</div>
            <Button variant="outline" onClick={() => navigate("/sales")} className="rounded-full">
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
                            onClick={() => navigate("/sales")}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl border bg-white shadow-sm hover:bg-slate-50 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    {invoice?.invoiceNo || "Invoice Draft"}
                                </h1>
                                <StatusBadge status={status} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Sales Invoice • Created on {new Date(invoice.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onPdf} disabled={actionLoading} className="rounded-full border-slate-200 dark:border-slate-800">
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        {status === "draft" && (
                            <Button
                                onClick={() => setConfirmPost(true)}
                                disabled={actionLoading}
                                className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-6 shadow-lg shadow-slate-200 dark:shadow-none"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Post Invoice
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
                                    Line Items
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    {invoice?.items?.length || 0} items
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
                                        {invoice?.items?.map((it: any, idx: number) => {
                                            const qty = Number(it.qty ?? 0);
                                            const rate = Number(it.rate ?? 0);
                                            const amt = Number(it.amount ?? qty * rate);
                                            return (
                                                <tr key={idx} className="group transition-colors">
                                                    <td className="py-5">
                                                        {it.itemId ? (
                                                            <Link to={`/items/view/${it.itemId}?tab=ledger`} className="font-bold text-foreground hover:text-primary hover:underline">
                                                                {it.itemName || it.name || it.itemId || "—"}
                                                            </Link>
                                                        ) : (
                                                            <div className="font-bold text-foreground">{it.itemName || it.name || it.itemId || "—"}</div>
                                                        )}
                                                        <div className="text-xs text-muted-foreground mt-1">{it.description || "Product/Service"}</div>
                                                    </td>
                                                    <td className="py-5 text-right font-medium text-foreground">{qty}</td>
                                                    <td className="py-5 text-right font-medium text-foreground">
                                                        <MoneyText value={rate} />
                                                    </td>
                                                    <td className="py-5 text-right font-bold text-foreground">
                                                        <MoneyText value={amt} />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {/* Total Row */}
                                        {invoice?.items?.length > 0 && (
                                            <tr className="border-t-2 border-slate-100 dark:border-slate-800/80 font-bold bg-slate-50/30 dark:bg-slate-800/10">
                                                <td className="py-4 text-left uppercase text-[10px] tracking-wider text-muted-foreground">Total</td>
                                                <td className="py-4 text-right">
                                                    {invoice.items.reduce((s: number, i: any) => s + Number(i.qty || 0), 0)}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <MoneyText value={invoice.items.reduce((s: number, i: any) => s + Number(i.rate || 0), 0)} />
                                                </td>
                                                <td className="py-4 text-right">
                                                    <MoneyText value={invoice.items.reduce((s: number, i: any) => s + Number(i.amount ?? (Number(i.qty || 0) * Number(i.rate || 0))), 0)} />
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
                                        <span className="font-semibold text-foreground"><MoneyText value={Number(invoice.subtotal || 0)} /></span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>VAT Amount</span>
                                        <span className="font-semibold text-foreground"><MoneyText value={Number(invoice.vatAmount || 0)} /></span>
                                    </div>
                                    <div className="h-px bg-slate-50 dark:bg-slate-800/50 my-2" />
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-base font-bold text-foreground">Grand Total</span>
                                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-heading">
                                            <MoneyText value={Number(invoice.total || 0)} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-3xl border bg-white/90 p-8 shadow-sm dark:bg-slate-900/80">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Customer & Schedule</div>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 shrink-0">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Customer</div>
                                        <div className="text-sm font-bold text-foreground mt-0.5">{invoice?.partyName || invoice?.party?.name || "—"}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 shrink-0">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Invoice Date</div>
                                        <div className="text-sm font-bold text-foreground mt-0.5">{invoiceDate.primary}</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{invoiceDate.secondary}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 shrink-0">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Due Date</div>
                                        <div className="text-sm font-bold text-foreground mt-0.5">{dueDate.primary}</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{dueDate.secondary}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border bg-slate-50/50 p-6 dark:bg-slate-800/20">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">
                                <FileText className="h-3 w-3" />
                                Notes
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 text-sm text-muted-foreground border border-slate-100 dark:border-slate-800 leading-relaxed shadow-sm italic text-center">
                                {invoice?.notes || "No additional notes provided."}
                            </div>
                        </div>

                        {status !== "void" && (
                            <Button
                                variant="outline"
                                onClick={() => setConfirmVoid(true)}
                                className="w-full rounded-2xl h-12 border-red-100/50 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all font-semibold dark:border-red-900/20 dark:hover:bg-red-900/10"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Void Invoice
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmPost}
                title="Post Invoice?"
                description="Posting will finalize the invoice and update your customer ledger. This action is irreversible."
                confirmText="Post Invoice"
                onConfirm={onPost}
                onCancel={() => setConfirmPost(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmVoid}
                title="Void Invoice?"
                description="Voiding will revert the accounting impact. This action is irreversible."
                confirmText="Void Invoice"
                variant="danger"
                onConfirm={onVoid}
                onCancel={() => setConfirmVoid(false)}
                loading={actionLoading}
            />
        </div>
    );
}


