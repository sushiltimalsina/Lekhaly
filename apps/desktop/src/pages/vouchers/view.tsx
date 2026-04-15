// apps/desktop/src/pages/vouchers/view.tsx
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Printer,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    FileText,
    Wallet,
    Building2,
    Calendar,
    Receipt,
    MoreVertical,
    Clock,
    User,
    ArrowRight
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import { getVoucher, postVoucher, voidVoucher } from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function VoucherDetailPage() {
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
            setError(e?.message ?? "Failed to load voucher");
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

    const totalDebit = React.useMemo(() => {
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
            setError(e?.message ?? "Failed to post voucher");
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
            setError(e?.message ?? "Failed to void voucher");
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Auditing Ledger Entry...</p>
            </div>
        </div>
    );

    if (!voucher) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <div className="text-xl font-bold opacity-40 uppercase tracking-widest">Entry Not Found</div>
            <Button variant="outline" onClick={() => navigate("/vouchers")} className="rounded-2xl h-11 px-8 font-black text-[10px] uppercase">
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
                            onClick={() => navigate("/vouchers")}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl border bg-slate-50 hover:bg-slate-100 transition-all shadow-inner"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl uppercase">
                                    {voucher?.voucherNumber || "ENTRY DRAFT"}
                                </h1>
                                <StatusBadge status={status} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
                                Financial Sequence • Category: {voucher.voucherType.replace("_", " ")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-2xl h-11 px-6 border-2 font-black text-[10px] uppercase tracking-widest">
                            <Printer className="mr-2 h-4 w-4" /> Print Evidence
                        </Button>
                        {status === "draft" && (
                            <Button
                                onClick={() => setConfirmPost(true)}
                                disabled={actionLoading}
                                className="rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest h-11 px-8 shadow-xl shadow-indigo-100"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Commit to Ledger
                            </Button>
                        )}
                        <Button variant="outline" className="h-11 w-11 p-0 rounded-2xl border-2 flex items-center justify-center">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-600 uppercase tracking-wide">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="rounded-[32px] border-2 border-slate-50 bg-slate-50/20 p-8">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-50">
                                <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px]">
                                    <Receipt className="h-4 w-4" /> Double Entry Breakdown
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-100">
                                            <th className="text-left pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Account Registry</th>
                                            <th className="text-right pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Debit Value</th>
                                            <th className="text-right pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Credit Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {voucher?.lines?.map((l: any, idx: number) => (
                                            <tr key={idx} className="group">
                                                <td className="py-5">
                                                    <div className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{l.account?.name || l.accountName || "General Account"}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">{l.description || "System Audit"}</div>
                                                </td>
                                                <td className={cn("py-5 text-right font-black tabular-nums text-[12px]", Number(l.debit) > 0 ? "text-slate-900" : "text-slate-200")}>
                                                    <MoneyText value={Number(l.debit || 0)} />
                                                </td>
                                                <td className={cn("py-5 text-right font-black tabular-nums text-[12px]", Number(l.credit) > 0 ? "text-slate-900" : "text-slate-200")}>
                                                    <MoneyText value={Number(l.credit || 0)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-4 border-slate-50">
                                        <tr className="bg-slate-50/50">
                                            <td className="py-5 px-4 font-black text-[10px] uppercase text-indigo-600">Registry Totals</td>
                                            <td className="py-5 text-right font-black text-slate-900 text-[14px] tabular-nums underline decoration-indigo-100 decoration-4">
                                                <MoneyText value={totalDebit} />
                                            </td>
                                            <td className="py-5 text-right font-black text-slate-900 text-[14px] tabular-nums underline decoration-indigo-100 decoration-4">
                                                <MoneyText value={totalDebit} />
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[32px] border-2 border-slate-50 bg-white p-8">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8 border-b pb-4">Audit Metadata</div>
                            <div className="space-y-8">
                                <DataField icon={Building2} label="Entity/Counterparty" value={voucher?.party?.name || voucher?.partyName || "Internal Registry"} color="bg-indigo-50 text-indigo-600" />
                                <DataField icon={Calendar} label="Voucher Scale Date" value={voucherDate.primary} sub={voucherDate.secondary} color="bg-amber-50 text-amber-600" />
                                <DataField icon={Clock} label="System Timestamp" value={new Date(voucher.createdAt).toLocaleString()} color="bg-slate-50 text-slate-400" />
                                <DataField icon={User} label="Record Creator" value={voucher.createdByUser?.name || "System Automated"} color="bg-slate-50 text-slate-400" />
                            </div>
                        </div>

                        <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
                                <FileText className="h-4 w-4" /> Auditor Memo
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider italic">
                                {voucher?.memo || "No additional audit notes provided for this transaction sequence."}
                            </div>
                        </div>

                        {status !== "void" && (
                            <Button
                                onClick={() => setConfirmVoid(true)}
                                variant="outline"
                                className="w-full rounded-[24px] h-14 border-rose-100 text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest"
                            >
                                <Trash2 className="mr-3 h-4 w-4" /> Invalidate Entry (Void)
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmPost}
                title="Commit Voucher?"
                description="This will finalize the financial sequence and update related ledgers. Irreversible without voiding."
                confirmText="Commit Entry"
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
