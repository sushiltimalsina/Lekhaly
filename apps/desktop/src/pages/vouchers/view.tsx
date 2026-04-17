"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Printer,
    Trash2,
    CheckCircle2,
    ChevronLeft,
    FileText,
    Download,
    ExternalLink,
    Paperclip,
    Clock,
    User,
    AlertCircle,
    MoreVertical,
    Plus,
    ArrowRight
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import {
    getVoucher,
    previewVoucher,
    postVoucher,
    voidVoucher,
    listVoucherAttachments,
    getVoucherAttachmentUrl,
    deleteVoucherAttachment,
} from "@/lib/api/vouchers";
import { generateVoucherPdf, getPdfJobUrl } from "@/lib/api/pdf";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay, getDateLabel } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@lekhaly/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@lekhaly/ui";

export default function VoucherDetailPage() {
    const params = useParams();
    const navigate = useNavigate();
    const id = params?.id;
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [voucher, setVoucher] = React.useState<any>(null);
    const [preview, setPreview] = React.useState<any>(null);
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
                const p = await previewVoucher(id);
                setPreview(p);
            } catch {
                setPreview(null);
            }

            try {
                const a = await listVoucherAttachments(id);
                const list = Array.isArray(a) ? a : a?.items ?? a?.data ?? [];
                setAttachments(list);
            } catch {
                setAttachments([]);
            }
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

    const totals = React.useMemo(() => {
        const lines: any[] = voucher?.lines ?? preview?.lines ?? [];
        let dr = 0;
        let cr = 0;
        for (const l of lines) {
            dr += Number(l.debit ?? 0);
            cr += Number(l.credit ?? 0);
        }
        return { dr, cr, balanced: Math.abs(dr - cr) < 0.001 };
    }, [voucher, preview]);

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

    async function onPdf() {
        if (!id) return;
        setActionLoading(true);
        setError(null);
        try {
            const job: any = await generateVoucherPdf(id);
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

    async function openAttachment(attId: string) {
        if (!id) return;
        setActionLoading(true);
        setError(null);
        try {
            const res: any = await getVoucherAttachmentUrl(id, attId);
            const url = res?.url ?? res?.signedUrl ?? res;
            if (!url) throw new Error("Attachment URL not returned by server");
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (e: any) {
            setError(e?.message ?? "Failed to open attachment");
        } finally {
            setActionLoading(false);
        }
    }

    async function removeAttachment(attId: string) {
        if (!id) return;
        setActionLoading(true);
        setError(null);
        try {
            await deleteVoucherAttachment(id, attId);
            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to delete attachment");
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-vh-70 py-24 space-y-4">
                <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Fetching voucher details...</p>
            </div>
        );
    }

    if (!voucher) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border-2 border-dashed border-rose-200 dark:border-rose-800">
                    <AlertCircle className="h-8 w-8 text-rose-300" />
                </div>
                <div className="max-w-xs space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">Voucher Not Found</h3>
                    <p className="text-sm text-slate-500">The voucher you are looking for doesn't exist or has been deleted.</p>
                </div>
                <Button onClick={() => navigate("/vouchers")} variant="outline" className="rounded-2xl">
                    Back to list
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate("/vouchers")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-1"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back to Vouchers
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                            {voucher?.voucherNumber || "DRAFT-" + voucher.id.slice(0, 4)}
                        </h1>
                        <StatusBadge status={status} className="h-6 px-3" />
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-4">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created {new Date(voucher.createdAt).toLocaleDateString()}</span>
                        {voucher.postedByUser && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Posted by {voucher.postedByUser.name}</span>}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={onPdf}
                        disabled={actionLoading}
                        className="rounded-2xl h-11 border-2 font-bold text-xs uppercase tracking-widest px-6"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print PDF
                    </Button>

                    {status === "draft" && (
                        <Button
                            onClick={() => setConfirmPost(true)}
                            disabled={actionLoading}
                            className="rounded-2xl h-11 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Post Voucher
                        </Button>
                    )}

                    {status !== "void" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-11 w-11 p-0 rounded-2xl border-2">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px]">
                                {status === "posted" && (
                                    <DropdownMenuItem
                                        onClick={() => setConfirmVoid(true)}
                                        className="flex items-center gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-xl px-3 py-2.5 font-bold text-xs uppercase tracking-widest"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Void Voucher
                                    </DropdownMenuItem>
                                )}
                                {/* Add edit action if draft */}
                                {status === "draft" && (
                                    <DropdownMenuItem
                                        onClick={() => navigate(`/${voucher.voucherType}s/create?id=${id}`)}
                                        className="flex items-center gap-2 text-slate-700 rounded-xl px-3 py-2.5 font-bold text-xs uppercase tracking-widest"
                                    >
                                        Edit Draft
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 flex items-start gap-3 text-rose-700">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="text-sm font-medium">{error}</div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Card */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <VoucherField label="Voucher Type" value={voucher.voucherType} isType />
                            <VoucherField label="Voucher Date" value={voucherDate.primary} subLabel={voucherDate.secondary} />
                            <VoucherField label="Reference No." value={voucher.referenceNo || "—"} />
                            <VoucherField label="Party / Entity" value={voucher.party?.name || voucher.partyName || "General"} />
                        </div>

                        {voucher.memo && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memo / Remarks</span>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium capitalize">
                                    {voucher.memo}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Lines Table */}
                    <div className="rounded-[32px] border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                            <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Ledger Entries</h3>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                                totals.balanced ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                            )}>
                                {totals.balanced ? "Double Entry Balanced" : "Out of Balance"}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Account / Party</th>
                                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Description</th>
                                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">Debit</th>
                                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">Credit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {((voucher?.lines ?? preview?.lines) ?? []).map((l: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{l.account?.name || l.accountName || l.accountId}</span>
                                                    {l.partyName && <span className="text-[11px] text-slate-400 font-medium italic">{l.partyName}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-slate-600 dark:text-slate-400 max-w-[240px] truncate">{l.description || "—"}</p>
                                            </td>
                                            <td className="px-6 py-5 text-right tabular-nums">
                                                {Number(l.debit) > 0 ? (
                                                    <span className="font-black text-slate-900 dark:text-white"><MoneyText value={l.debit} /></span>
                                                ) : <span className="text-slate-200 dark:text-slate-800">—</span>}
                                            </td>
                                            <td className="px-6 py-5 text-right tabular-nums">
                                                {Number(l.credit) > 0 ? (
                                                    <span className="font-black text-slate-900 dark:text-white"><MoneyText value={l.credit} /></span>
                                                ) : <span className="text-slate-200 dark:text-slate-800">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <td colSpan={2} className="px-6 py-5 font-black text-xs uppercase tracking-widest text-slate-500">Totals</td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white text-base underline underline-offset-4 decoration-slate-200 tabular-nums">
                                            <MoneyText value={totals.dr} />
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white text-base underline underline-offset-4 decoration-slate-200 tabular-nums">
                                            <MoneyText value={totals.cr} />
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Space */}
                <div className="space-y-6">
                    {/* Attachments Card */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Attachments</h3>
                            <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full text-slate-500">
                                {attachments.length}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {attachments.length > 0 ? (
                                attachments.map((a) => {
                                    const attId = a.id ?? a.attachmentId;
                                    const name = a.name || a.filename || a.originalName || "Unnamed Attachment";
                                    return (
                                        <div key={attId} className="group p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900/50">
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                                    <FileText className="h-5 w-5 text-indigo-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{name}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">ID: {attId.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <Button
                                                    onClick={() => openAttachment(attId)}
                                                    variant="secondary"
                                                    className="h-8 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-white hover:bg-slate-50"
                                                >
                                                    <ExternalLink className="h-3 w-3" /> View
                                                </Button>
                                                <Button
                                                    onClick={() => removeAttachment(attId)}
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 rounded-xl border-rose-100 hover:bg-rose-50 hover:border-rose-200 text-rose-500"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                    <Paperclip className="h-6 w-6 text-slate-200 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">No attachments linked to this voucher</p>
                                </div>
                            )}

                            <Button className="w-full mt-2 rounded-2xl h-10 border-2 border-dashed hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 text-[10px] font-black uppercase tracking-widest gap-2 bg-transparent transition-all">
                                <Plus className="h-4 w-4" /> Upload Document
                            </Button>
                        </div>
                    </div>

                    {/* Activity/Context Card */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-4">Internal Context</h3>
                        <div className="space-y-4">
                            <ContextItem
                                icon={Clock}
                                label="System Entry"
                                value={new Date(voucher.createdAt).toLocaleString()}
                            />
                            <ContextItem
                                icon={User}
                                label="Author"
                                value={voucher.createdByUser?.name || "System Automated"}
                            />
                            <ContextItem
                                icon={ArrowRight}
                                label="Voucher ID"
                                value={id ?? ""}
                                isMono
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmPost}
                title="Post voucher?"
                description="Posting will finalize the voucher entries into your ledgers. This action cannot be undone without voiding."
                confirmText="Confirm & Post"
                onConfirm={onPost}
                onCancel={() => setConfirmPost(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmVoid}
                title="Void this voucher?"
                description="Voiding will mark this transaction as invalid and reverse any ledger impact. Proceed with caution."
                confirmText="Void Transaction"
                variant="danger"
                onConfirm={onVoid}
                onCancel={() => setConfirmVoid(false)}
                loading={actionLoading}
            />
        </div>
    );
}

function VoucherField({ label, value, subLabel, isType = false }: { label: string; value: string; subLabel?: string; isType?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className="flex flex-col">
                {isType ? (
                    <span className="font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg text-xs uppercase tracking-widest inline-block w-fit mt-1 border border-indigo-100 dark:border-indigo-800/50">
                        {value.replace("_", " ")}
                    </span>
                ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{value}</span>
                )}
                {subLabel && <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">{subLabel}</span>}
            </div>
        </div>
    );
}

function ContextItem({ icon: Icon, label, value, isMono = false }: { icon: any, label: string, value: string, isMono?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                <Icon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className={cn(
                    "text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5",
                    isMono && "font-mono"
                )}>{value}</p>
            </div>
        </div>
    );
}


