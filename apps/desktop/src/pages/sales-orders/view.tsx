// apps/desktop/src/pages/sales-orders/view.tsx
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Printer,
    ChevronLeft,
    Clock,
    User,
    AlertCircle,
    MoreVertical,
    Package,
    Calendar,
    Receipt,
    XCircle,
    FileText,
    ArrowUpRight
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import {
    getSalesOrder,
    cancelSalesOrder,
    convertToInvoice
} from "@/lib/api/sales-orders";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@lekhaly/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@lekhaly/ui";

export default function SalesOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [order, setOrder] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [confirmCancel, setConfirmCancel] = React.useState(false);
    const [confirmConvert, setConfirmConvert] = React.useState(false);

    async function load() {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getSalesOrder(id);
            setOrder(res);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load sales order");
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative h-12 w-12 text-indigo-600">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 italic opacity-20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-current border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Retrieving Order Registry...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center border-2 border-dashed border-rose-100">
                    <AlertCircle className="h-8 w-8 text-rose-300" />
                </div>
                <div className="max-w-xs space-y-1">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs italic">Registry Identity Lost</h3>
                    <p className="text-sm text-slate-500 font-medium">The sales order record requested does not exist in the active ledger.</p>
                </div>
                <Button onClick={() => navigate("/sales-orders")} variant="outline" className="rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest px-8">
                    Return to Registry
                </Button>
            </div>
        );
    }

    const status: DocStatus = (order.status ?? "draft") as DocStatus;
    const orderDate = getDateDisplay({ ad: order.orderDate, bs: order.orderDateBs, format: dateFormat });
    const deliveryDate = order.expectedDelivery ? getDateDisplay({ ad: order.expectedDelivery, bs: order.expectedDeliveryBs, format: dateFormat }) : null;

    async function onCancel() {
        if (!id) return;
        setActionLoading(true);
        try {
            await cancelSalesOrder(id);
            setConfirmCancel(false);
            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to cancel order");
        } finally {
            setActionLoading(false);
        }
    }

    async function onConvert() {
        if (!id) return;
        setActionLoading(true);
        try {
            const res: any = await convertToInvoice(id);
            const invoiceId = res?.id ?? res?.invoiceId;
            setConfirmConvert(false);
            if (invoiceId) {
                navigate(`/sales/create?id=${invoiceId}`);
            } else {
                await load();
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to convert to invoice");
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate("/sales-orders")}
                        className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mb-2"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back to Registry
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                            {order.orderNo || "Order Draft"}
                        </h1>
                        <StatusBadge status={status} className="h-7 px-4 shadow-sm" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        disabled={actionLoading}
                        className="rounded-2xl h-11 border-2 font-black text-xs uppercase tracking-widest px-6 hover:bg-slate-50 transition-all"
                    >
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>

                    {(status === "open" || status === "draft") && (
                        <Button
                            onClick={() => setConfirmConvert(true)}
                            disabled={actionLoading}
                            className="rounded-2xl h-11 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest px-8 shadow-xl shadow-indigo-100 hover:bg-slate-900 hover:scale-[1.02] active:scale-95 transition-all italic"
                        >
                            <Receipt className="mr-2 h-4 w-4" />
                            Initialize Invoicing
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-11 w-11 p-0 rounded-2xl border-2 hover:bg-slate-50">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] shadow-2xl border-2 border-slate-50">
                            {status === "open" && (
                                <DropdownMenuItem
                                    onClick={() => setConfirmCancel(true)}
                                    className="flex items-center gap-3 text-rose-600 rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <XCircle className="h-4 w-4" /> Cancel Order Pipeline
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => navigate(`/sales-orders/create?id=${id}`)}
                                className="flex items-center gap-3 text-slate-700 rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest"
                            >
                                <FileText className="h-4 w-4" /> Edit Master Record
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {error && (
                <div className="rounded-[24px] border-2 border-rose-100 bg-rose-50/50 p-6 flex items-start gap-4 text-rose-700 animate-shake">
                    <AlertCircle className="h-6 w-6 shrink-0" />
                    <div className="text-xs font-black uppercase tracking-widest">{error}</div>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    {/* Primary Logistics Data */}
                    <div className="rounded-[32px] border-2 border-slate-50 bg-white p-10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                             <Package className="h-24 w-24 text-indigo-600" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
                            <DocumentField label="Consignee" value={order.partyName || "Unknown Party"} />
                            <DocumentField label="Execution Date" value={orderDate.primary} subLabel={orderDate.secondary} />
                            <DocumentField label="Fulfillment Goal" value={deliveryDate?.primary || "Pending"} subLabel={deliveryDate?.secondary} />
                            <DocumentField label="Order Magnitude" value={<MoneyText value={order.total} />} isTotal />
                        </div>

                        {order.memo && (
                            <div className="mt-10 pt-8 border-t border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic block mb-3">Auditor Narrations</span>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-5 rounded-3xl border border-slate-50 italic">
                                    "{order.memo}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Line Items Registry */}
                    <div className="rounded-[32px] border-2 border-slate-50 bg-white overflow-hidden shadow-sm">
                        <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                            <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em] italic flex items-center gap-3">
                                <Package className="h-4 w-4 text-indigo-500" /> Item Manifest
                            </h3>
                            <div className="flex gap-4">
                                <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 italic">
                                    {order.items?.length || 0} SEPARATE ENTRIES
                                </div>
                                {order.fulfilledAmount > 0 && (
                                    <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 italic">
                                        FULFILLED: <MoneyText value={order.fulfilledAmount} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/30">
                                    <tr>
                                        <th className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-[9px]">Resource / SKU Identity</th>
                                        <th className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center">Volume</th>
                                        <th className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Unit Factor</th>
                                        <th className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Valuation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(order.items || []).map((l: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-indigo-50/10 transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{l.itemName || l.itemId}</span>
                                                    {l.description && <span className="text-[11px] text-slate-400 font-bold italic mt-1">{l.description}</span>}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center font-black text-slate-600 tabular-nums">
                                                {l.qty}
                                            </td>
                                            <td className="px-10 py-6 text-right font-bold text-slate-600 tabular-nums">
                                                <MoneyText value={l.rate} />
                                            </td>
                                            <td className="px-10 py-6 text-right tabular-nums">
                                                <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors"><MoneyText value={l.qty * l.rate} /></span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Monetary Reconciliation */}
                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="rounded-[32px] border-2 border-slate-50 bg-white p-10 shadow-sm">
                            <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em] mb-6 italic">Contractual Terms</h3>
                            <div className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50/50 p-6 rounded-3xl border border-slate-50 italic whitespace-pre-line">
                                {order.terms || "Standard commercial fulfillment terms apply. No specific overrides provided."}
                            </div>
                        </div>

                        <div className="rounded-[32px] border-2 border-slate-50 bg-slate-900 p-10 shadow-2xl text-white relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-6 transition-transform duration-700">
                                <Receipt className="h-32 w-32" />
                            </div>
                            <div className="relative z-10 space-y-5">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    <span>Resources Subtotal</span>
                                    <span className="text-white"><MoneyText value={order.total - (order.sundries?.reduce((s: number, r: any) => s + r.amount, 0) || 0)} /></span>
                                </div>
                                {(order.sundries || []).map((s: any, i: number) => (
                                    <div key={i} className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                        <span>{s.name} {s.rate ? `(${s.rate}%)` : ""}</span>
                                        <span className={s.type === 'less' ? "text-rose-400" : "text-emerald-400"}>
                                            {s.type === 'less' ? "- " : "+ "}
                                            <MoneyText value={s.amount} />
                                        </span>
                                    </div>
                                ))}
                                <div className="h-px bg-slate-800 my-8" />
                                <div className="flex justify-between items-center">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Net Pipeline Magnitude</span>
                                        <div className="text-4xl font-black tabular-nums tracking-tighter">
                                            <MoneyText value={order.total} />
                                        </div>
                                    </div>
                                    <div className="h-16 w-16 rounded-[24px] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/10">
                                        <Package className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracking & Logic Sidebar */}
                <div className="space-y-8">
                    <div className="rounded-[32px] border-2 border-slate-50 bg-white p-10 shadow-sm relative overflow-hidden">
                        <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em] mb-10 border-b-2 border-slate-50 pb-6 italic">Pipeline Flow</h3>
                        <div className="space-y-10">
                            <InfoRow icon={Calendar} label="Engagement Locked" value={orderDate.primary} isActive />
                            <div className="h-10 w-1 bg-slate-50 ml-4.5 -mt-6 rounded-full" />
                            <InfoRow icon={Receipt} label="Invoicing Phase" value={order.fulfilledAmount >= order.total ? "Completed" : order.fulfilledAmount > 0 ? "In Progress" : "Awaiting Init"} isActive={order.fulfilledAmount > 0} />
                            <div className="h-10 w-1 bg-slate-50 ml-4.5 -mt-6 rounded-full" />
                            <InfoRow icon={Package} label="Ultimate Dispatch" value={order.status === 'fulfilled' ? "Delivered" : "Queued"} isActive={order.status === 'fulfilled'} />
                        </div>
                    </div>

                    <div className="rounded-[32px] border-2 border-slate-50 bg-slate-50/50 p-10 dark:bg-slate-900/10">
                        <h3 className="font-black text-slate-400 text-xs uppercase tracking-[0.2em] mb-8 italic">Registry Metadata</h3>
                        <div className="space-y-8">
                            <InfoRow icon={User} label="Record Custodian" value={order.createdByUser?.name || "System Process"} />
                            <InfoRow icon={AlertCircle} label="Serial Identity" value={order.id} isMono />
                            {order.customerPoRef && (
                                <InfoRow icon={FileText} label="External PO ID" value={order.customerPoRef} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmCancel}
                title="Nullify this order?"
                description="This will permanently revoke the order registry. This process is immutable and logged."
                confirmText="Confirm Revoke"
                variant="danger"
                onConfirm={onCancel}
                onCancel={() => setConfirmCancel(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmConvert}
                title="Initialize Invoicing?"
                description="Initialize a Sales Invoice draft from this order manifest. You can perform final calibrations on the next screen."
                confirmText="Generate Invoice Draft"
                onConfirm={onConvert}
                onCancel={() => setConfirmConvert(false)}
                loading={actionLoading}
            />
        </div>
    );
}

function DocumentField({ label, value, subLabel, isTotal = false }: { label: string; value: any; subLabel?: string; isTotal?: boolean }) {
    return (
        <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className="flex flex-col gap-1">
                <div className={cn(
                    "font-black text-slate-900 tracking-tight",
                    isTotal ? "text-3xl text-indigo-600 italic" : "text-sm",
                )}>
                    {value}
                </div>
                {subLabel && <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{subLabel}</span>}
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, isMono = false, isActive = false }: { icon: any, label: string, value: string, isMono?: boolean, isActive?: boolean }) {
    return (
        <div className="flex items-start gap-6">
            <div className={cn(
                "h-10 w-10 rounded-[14px] flex items-center justify-center shrink-0 border-2 transition-all duration-300",
                isActive
                    ? "bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-100"
                    : "bg-white border-slate-50 text-slate-300"
            )}>
                <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-slate-300")} />
            </div>
            <div className="min-w-0 flex flex-col pt-0.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
                <p className={cn(
                    "font-black tracking-tight truncate",
                    isActive ? "text-sm text-slate-900" : "text-xs text-slate-500 opacity-60",
                    isMono && "font-mono"
                )}>{value}</p>
            </div>
        </div>
    );
}
