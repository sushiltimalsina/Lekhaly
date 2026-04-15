// apps/desktop/src/pages/sales/view.tsx
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import { getInvoice, postInvoice, voidInvoice } from "@/lib/api/invoices";
import { generateInvoicePdf, getPdfJobUrl } from "@/lib/api/pdf";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { ArrowLeft, Printer, MoreVertical, Trash2, CheckCircle2, Receipt, Building2, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SalesDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
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
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Auditing Registry Details...</p>
            </div>
        </div>
    );

    if (!invoice) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <div className="text-xl font-bold opacity-40 uppercase tracking-widest">Entry Not Found</div>
            <Button variant="outline" onClick={() => navigate("/sales")} className="rounded-2xl h-11 px-8">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
            </Button>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="rounded-[28px] border bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-10">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate("/sales")}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl border bg-slate-50 hover:bg-slate-100 transition-all active:scale-95 shadow-inner"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl uppercase">
                                    {invoice?.invoiceNo || "Invoice Draft"}
                                </h1>
                                <StatusBadge status={status} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
                                Sales Audit Trail • Entry Point: {new Date(invoice.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={onPdf} disabled={actionLoading} className="rounded-2xl h-11 px-6 border-2 font-black text-[10px] uppercase tracking-widest">
                            <Printer className="mr-2 h-4 w-4" />
                            Print Certificate
                        </Button>
                        {status === "draft" && (
                            <Button
                                onClick={() => setConfirmPost(true)}
                                disabled={actionLoading}
                                className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 h-11 px-8 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Commit to Ledger
                            </Button>
                        )}
                        <Button variant="outline" className="h-11 w-11 p-0 rounded-2xl border-2 flex items-center justify-center">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {error ? (
                    <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-600 uppercase tracking-wide">
                        {error}
                    </div>
                ) : null}

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="rounded-[32px] border-2 border-slate-50 bg-slate-50/20 p-8">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-50">
                                <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px]">
                                    <Receipt className="h-4 w-4" />
                                    Transaction Ledger
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {invoice?.items?.length || 0} Registered Units
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-100">
                                            <th className="text-left pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Unit Description</th>
                                            <th className="text-right pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Qty</th>
                                            <th className="text-right pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Value/Unit</th>
                                            <th className="text-right pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {invoice?.items?.map((it: any, idx: number) => (
                                            <tr key={idx} className="group">
                                                <td className="py-5">
                                                    <div className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{it.itemName || it.name || it.itemId || "—"}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">{it.description || "General Inventory"}</div>
                                                </td>
                                                <td className="py-5 text-right font-black text-slate-900 tabular-nums uppercase text-[11px]">{Number(it.qty || 0).toLocaleString()}</td>
                                                <td className="py-5 text-right font-bold text-slate-600 tabular-nums text-[11px]">
                                                    <MoneyText value={Number(it.rate || 0)} />
                                                </td>
                                                <td className="py-5 text-right font-black text-slate-900 tabular-nums text-[13px]">
                                                    <MoneyText value={Number(it.amount ?? (Number(it.qty || 0) * Number(it.rate || 0)))} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-12 pt-8 border-t-4 border-slate-50 flex flex-col items-end">
                                <div className="w-full sm:w-80 space-y-5">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Gross Value</span>
                                        <span className="text-slate-900"><MoneyText value={Number(invoice.subtotal || 0)} /></span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Tax Liability (VAT)</span>
                                        <span className="text-slate-900"><MoneyText value={Number(invoice.vatAmount || 0)} /></span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-2" />
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">Net Commitment</span>
                                        <span className="text-3xl font-black text-slate-900 tabular-nums">
                                            <MoneyText value={Number(invoice.total || 0)} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-[32px] border-2 border-slate-50 bg-white p-8">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8 border-b pb-4">Schedule Metadata</div>
                            <div className="space-y-8">
                                <DataField icon={Building2} label="Entity/Customer" value={invoice?.partyName || invoice?.party?.name || "—"} color="bg-indigo-50 text-indigo-600" />
                                <DataField icon={Calendar} label="Audit Date" value={invoiceDate.primary} sub={invoiceDate.secondary} color="bg-amber-50 text-amber-600" />
                                <DataField icon={Calendar} label="Maturity Date" value={dueDate.primary} sub={dueDate.secondary} color="bg-rose-50 text-rose-600" />
                            </div>
                        </div>

                        <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
                                <FileText className="h-4 w-4" />
                                Internal Notes
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider italic">
                                {invoice?.notes || "No additional audit notes provided for this transaction sequence."}
                            </div>
                        </div>

                        {status !== "void" && (
                            <Button
                                onClick={() => setConfirmVoid(true)}
                                variant="outline"
                                className="w-full rounded-[24px] h-14 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                                <Trash2 className="mr-3 h-4 w-4" />
                                Invalidate Entry (Void)
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmPost}
                title="Commit to Ledger?"
                description="This action will finalize the transaction and update your permanent audit trail. This cannot be undone."
                confirmText="Commit Entry"
                onConfirm={onPost}
                onCancel={() => setConfirmPost(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmVoid}
                title="Invalidate Record?"
                description="This will mark the entry as VOID and reverse its ledger impact. This action is recorded in the permanent audit logs."
                confirmText="Invalidate"
                variant="danger"
                onConfirm={onVoid}
                onCancel={() => setConfirmVoid(false)}
                loading={actionLoading}
            />
        </div>
    );
}

function DataField({ icon: Icon, label, value, sub, color }: { icon: any, label: string, value: string, sub?: string, color: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className={cn("h-11 w-11 flex items-center justify-center rounded-2xl shrink-0 shadow-sm", color)}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</div>
                <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">{value}</div>
                {sub && <div className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-tight">{sub}</div>}
            </div>
        </div>
    );
}
