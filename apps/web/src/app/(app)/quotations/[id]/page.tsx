"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Printer,
    Trash2,
    CheckCircle2,
    ChevronLeft,
    FileText,
    Download,
    ExternalLink,
    Clock,
    User,
    AlertCircle,
    MoreVertical,
    FileSignature,
    Calendar,
    ArrowRight,
    ArrowUpRight,
    XCircle
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import {
    getQuotation,
    acceptQuotation,
    declineQuotation,
    convertToSalesOrder
} from "@/lib/api/quotations";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function QuotationDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params?.id;
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [quotation, setQuotation] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [confirmAccept, setConfirmAccept] = React.useState(false);
    const [confirmDecline, setConfirmDecline] = React.useState(false);
    const [confirmConvert, setConfirmConvert] = React.useState(false);

    async function load() {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const q = await getQuotation(id);
            setQuotation(q);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load quotation");
            setQuotation(null);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        load();
    }, [id]);

    const status: DocStatus = (quotation?.status ?? "draft") as DocStatus;
    const quoteDate = getDateDisplay({ ad: quotation?.quotationDate, bs: quotation?.quotationDateBs, format: dateFormat });
    const expiryDate = quotation?.expiryDate ? getDateDisplay({ ad: quotation?.expiryDate, bs: quotation?.expiryDateBs, format: dateFormat }) : null;

    async function onAccept() {
        if (!id) return;
        setActionLoading(true);
        try {
            await acceptQuotation(id);
            setConfirmAccept(false);
            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to accept quotation");
        } finally {
            setActionLoading(false);
        }
    }

    async function onDecline() {
        if (!id) return;
        setActionLoading(true);
        try {
            await declineQuotation(id);
            setConfirmDecline(false);
            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to decline quotation");
        } finally {
            setActionLoading(false);
        }
    }

    async function onConvert() {
        if (!id) return;
        setActionLoading(true);
        try {
            const res: any = await convertToSalesOrder(id);
            const orderId = res?.id ?? res?.salesOrderId;
            setConfirmConvert(false);
            if (orderId) {
                router.push(`/sales-orders/${orderId}`);
            } else {
                await load();
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to convert to sales order");
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Loading Proposal...</p>
            </div>
        );
    }

    if (!quotation) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border-2 border-dashed border-rose-200 dark:border-rose-800">
                    <AlertCircle className="h-8 w-8 text-rose-300" />
                </div>
                <div className="max-w-xs space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">Quotation Not Found</h3>
                    <p className="text-sm text-slate-500">The quotation reference you provided could not be found.</p>
                </div>
                <Button onClick={() => router.push("/quotations")} variant="outline" className="rounded-2xl">
                    Back to Registry
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
                        onClick={() => router.push("/quotations")}
                        className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-1"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back to Proposals
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                            {quotation?.quotationNo || "Proposal Draft"}
                        </h1>
                        <StatusBadge status={status} className="h-6 px-3" />
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-4 font-medium">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Created {new Date(quotation.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Prepared for {quotation.partyName || "Unknown Customer"}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        disabled={actionLoading}
                        className="rounded-2xl h-11 border-2 font-black text-xs uppercase tracking-widest px-6"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Proposal
                    </Button>

                    {status === "accepted" && (
                        <Button
                            onClick={() => setConfirmConvert(true)}
                            disabled={actionLoading}
                            className="rounded-2xl h-11 bg-orange-600 text-white font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-orange-500/20 hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all"
                        >
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Convert to Order
                        </Button>
                    )}

                    {status === "sent" && (
                        <Button
                            onClick={() => setConfirmAccept(true)}
                            disabled={actionLoading}
                            className="rounded-2xl h-11 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Client Accepted
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-11 w-11 p-0 rounded-2xl border-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px]">
                            {status === "sent" && (
                                <DropdownMenuItem
                                    onClick={() => setConfirmDecline(true)}
                                    className="flex items-center gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-xl px-3 py-2.5 font-bold text-xs uppercase tracking-widest"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Mark Declined
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => router.push(`/quotations/create?id=${id}`)}
                                className="flex items-center gap-2 text-slate-700 rounded-xl px-3 py-2.5 font-bold text-xs uppercase tracking-widest"
                            >
                                Edit Document
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 flex items-start gap-3 text-rose-700">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="text-sm font-black uppercase tracking-tight">{error}</div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Matrix */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <DocumentField label="Proposal For" value={quotation.partyName || "Unknown Customer"} />
                            <DocumentField label="Quotation Date" value={quoteDate.primary} subLabel={quoteDate.secondary} />
                            <DocumentField label="Valid Until" value={expiryDate?.primary || "No expiry"} subLabel={expiryDate?.secondary} isAlert={status === 'expired'} />
                            <DocumentField label="Grand Total" value={<MoneyText value={quotation.total} />} isTotal />
                        </div>

                        {quotation.memo && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Memo</span>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                    {quotation.memo}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Items Registry */}
                    <div className="rounded-[32px] border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                            <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Itemized Breakdown</h3>
                            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-indigo-100">
                                {quotation.items?.length || 0} Line Items
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Product / Service</th>
                                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Qty</th>
                                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Unit Rate</th>
                                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {(quotation.items || []).map((l: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{l.itemName || l.itemId}</span>
                                                    {l.description && <span className="text-[11px] text-slate-400 font-medium italic mt-0.5">{l.description}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                                                {l.qty}
                                            </td>
                                            <td className="px-6 py-5 text-right font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                                                <MoneyText value={l.rate} />
                                            </td>
                                            <td className="px-6 py-5 text-right tabular-nums">
                                                <span className="font-black text-slate-900 dark:text-white"><MoneyText value={l.qty * l.rate} /></span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-4">Terms & Conditions</h3>
                            <div className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-line">
                                {quotation.terms || "Default company terms and conditions apply to this quotation."}
                            </div>
                        </div>

                        <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-8 shadow-xl text-white">
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                    <span>Items Subtotal</span>
                                    <span className="text-white"><MoneyText value={quotation.total - (quotation.sundries?.reduce((s: number, r: any) => s + r.amount, 0) || 0)} /></span>
                                </div>
                                {(quotation.sundries || []).map((s: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                                        <span>{s.name} {s.rate ? `(${s.rate}%)` : ""}</span>
                                        <span className={s.type === 'less' ? "text-rose-400" : "text-emerald-400"}>
                                            {s.type === 'less' ? "- " : "+ "}
                                            <MoneyText value={s.amount} />
                                        </span>
                                    </div>
                                ))}
                                <div className="h-px bg-slate-800 my-4" />
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Final Proposal Amount</span>
                                        <div className="text-3xl font-black tabular-nums tracking-tighter">
                                            <MoneyText value={quotation.total} />
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                                        <FileSignature className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Customer Context */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-6">Customer Context</h3>
                        <div className="space-y-6">
                            <InfoRow
                                icon={User}
                                label="Customer Name"
                                value={quotation.partyName || "Private Customer"}
                            />
                            <InfoRow
                                icon={Calendar}
                                label="Inquiry Date"
                                value={quoteDate.primary}
                            />
                            <InfoRow
                                icon={AlertCircle}
                                label="Quotation ID"
                                value={id}
                                isMono
                            />
                        </div>
                    </div>

                    {/* Quick Access Documents */}
                    <div className="rounded-[32px] border border-slate-200 bg-indigo-50/50 p-6 dark:border-indigo-900/20 dark:bg-indigo-900/10">
                        <h3 className="font-black text-indigo-900 dark:text-indigo-100 text-xs uppercase tracking-widest mb-4">Export Options</h3>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start rounded-xl border-indigo-100 bg-white hover:bg-indigo-50 font-bold text-xs uppercase tracking-widest h-11">
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                            </Button>
                            <Button variant="outline" className="w-full justify-start rounded-xl border-indigo-100 bg-white hover:bg-indigo-50 font-bold text-xs uppercase tracking-widest h-11">
                                <FileText className="mr-2 h-4 w-4" /> Export as CSV
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmAccept}
                title="Mark as Accepted?"
                description="This will update the quotation status to 'Accepted'. This usually means the client has agreed to the proposal."
                confirmText="Accept Proposal"
                onConfirm={onAccept}
                onCancel={() => setConfirmAccept(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmDecline}
                title="Mark as Declined?"
                description="This will update the quotation status to 'Declined'. You can still convert it later if the client changes their mind."
                confirmText="Decline Proposal"
                variant="danger"
                onConfirm={onDecline}
                onCancel={() => setConfirmDecline(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmConvert}
                title="Convert to Sales Order?"
                description="Convert this accepted quotation into an active Sales Order. This will close the quotation and create a new order registry."
                confirmText="Create Sales Order"
                onConfirm={onConvert}
                onCancel={() => setConfirmConvert(false)}
                loading={actionLoading}
            />
        </div>
    );
}

function DocumentField({ label, value, subLabel, isTotal = false, isAlert = false }: { label: string; value: any; subLabel?: string; isTotal?: boolean; isAlert?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className="flex flex-col">
                <div className={cn(
                    "font-black text-slate-800 dark:text-slate-100",
                    isTotal ? "text-xl text-indigo-600 dark:text-indigo-400" : "text-sm",
                    isAlert && "text-rose-600"
                )}>
                    {value}
                </div>
                {subLabel && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{subLabel}</span>}
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, isMono = false }: { icon: any, label: string, value: string, isMono?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50">
                <Icon className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className={cn(
                    "text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5",
                    isMono && "font-mono"
                )}>{value}</p>
            </div>
        </div>
    );
}
