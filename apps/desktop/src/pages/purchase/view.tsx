// apps/desktop/src/pages/purchase/view.tsx
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import { getVoucher, postVoucher, voidVoucher } from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { ArrowLeft, Printer, MoreVertical, Trash2, CheckCircle2, Receipt, Building2, Calendar, FileText, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PurchaseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [voucher, setVoucher] = React.useState<any>(null);
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
        } catch (e: any) {
            setError(e?.message ?? "Failed to load purchase voucher");
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
    
    const drTotal = React.useMemo(() => {
        return (voucher?.lines || []).reduce((sum: number, l: any) => sum + Number(l.debit || 0), 0);
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
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Auditing Purchase Ledger...</p>
            </div>
        </div>
    );

    if (!voucher) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <div className="text-xl font-bold opacity-40 uppercase tracking-widest">Voucher Not Found</div>
            <Button variant="outline" onClick={() => navigate("/purchase")} className="rounded-2xl h-11 px-8 font-black text-[10px] uppercase">
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
                            onClick={() => navigate("/purchase")}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl border bg-slate-50 hover:bg-slate-100 transition-all shadow-inner"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl uppercase">
                                    {voucher?.vendorInvoiceNo || voucher?.voucherNumber || "Purchase Draft"}
                                </h1>
                                <StatusBadge status={status} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
                                Purchase Evidence • Vendor Registry Sequence
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-2xl h-11 px-6 border-2 font-black text-[10px] uppercase tracking-widest">
                            <Printer className="mr-2 h-4 w-4" />
                            Print Record
                        </Button>
                        {status === "draft" && (
                            <Button
                                onClick={() => setConfirmPost(true)}
                                disabled={actionLoading}
                                className="rounded-2xl bg-orange-600 text-white hover:bg-orange-700 h-11 px-8 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-100"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Commit Bill
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
                    <div className="lg:col-span-2 space-y-8">
                        <div className="rounded-[32px] border-2 border-slate-50 bg-slate-50/20 p-8">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-50">
                                <div className="flex items-center gap-2 text-orange-600 font-black uppercase tracking-[0.2em] text-[10px]">
                                    <ShoppingBag className="h-4 w-4" />
                                    Vendor Inward Registry
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-100">
                                            <th className="text-left pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Material/Unit</th>
                                            <th className="text-right pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Qty</th>
                                            <th className="text-right pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Rate</th>
                                            <th className="text-right pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Net Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {voucher?.lines?.map((l: any, idx: number) => {
                                            if (Number(l.debit) === 0) return null;
                                            const qty = Number(l.qty || 1);
                                            const debit = Number(l.debit || 0);
                                            const rate = debit / qty;
                                            return (
                                                <tr key={idx} className="group">
                                                    <td className="py-5">
                                                        <div className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{l.accountName || l.description || "General Purchase"}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">{l.description || "Inward Inventory"}</div>
                                                    </td>
                                                    <td className="py-5 text-right font-black text-slate-900 tabular-nums text-[11px]">{qty.toLocaleString()}</td>
                                                    <td className="py-5 text-right font-bold text-slate-600 tabular-nums text-[11px]">
                                                        <MoneyText value={rate} />
                                                    </td>
                                                    <td className="py-5 text-right font-black text-slate-900 tabular-nums text-[13px]">
                                                        <MoneyText value={debit} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-12 pt-8 border-t-4 border-slate-50 flex flex-col items-end">
                                <div className="w-full sm:w-80 space-y-5">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-[11px] font-black text-orange-600 uppercase tracking-[0.3em]">Payable Liability</span>
                                        <span className="text-3xl font-black text-slate-900 tabular-nums">
                                            <MoneyText value={drTotal} />
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
                                <DataField icon={Building2} label="Supplier Entity" value={voucher?.party?.name || "—"} color="bg-orange-50 text-orange-600" />
                                <DataField icon={Calendar} label="Audit Date" value={voucherDate.primary} sub={voucherDate.secondary} color="bg-amber-50 text-amber-600" />
                                <DataField icon={Receipt} label="Voucher ID" value={voucher?.voucherNumber || "—"} color="bg-slate-50 text-slate-600" />
                            </div>
                        </div>

                        <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
                                <FileText className="h-4 w-4" />
                                Auditor Memo
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider italic">
                                {voucher?.memo || "No additional audit notes provided for this inward sequence."}
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
                title="Commit Purchase?"
                description="This action will finalize the liability and inward stock levels. This cannot be undone."
                confirmText="Commit Bill"
                onConfirm={onPost}
                onCancel={() => setConfirmPost(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmVoid}
                title="Invalidate Record?"
                description="This will mark the entry as VOID and reverse its accounting impact."
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
