"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Printer,
    ChevronLeft,
    Clock,
    User,
    AlertCircle,
    MoreVertical,
    PackageSearch,
    Calendar,
    ArrowUpRight,
    XCircle,
    FileText,
    ShoppingCart
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import ConfirmDialog from "@/components/app/confirm-dialog";
import {
    getPurchaseOrder,
    cancelPurchaseOrder,
    convertToPurchase
} from "@/lib/api/purchase-orders";
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

export default function PurchaseOrderDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params?.id;
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
            const res = await getPurchaseOrder(id);
            setOrder(res);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load purchase order");
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        load();
    }, [id]);

    const status: DocStatus = (order?.status ?? "draft") as DocStatus;
    const orderDate = getDateDisplay({ ad: order?.orderDate, bs: order?.orderDateBs, format: dateFormat });
    const deliveryDate = order?.expectedDelivery ? getDateDisplay({ ad: order?.expectedDelivery, bs: order?.expectedDeliveryBs, format: dateFormat }) : null;

    async function onCancel() {
        if (!id) return;
        setActionLoading(true);
        try {
            await cancelPurchaseOrder(id);
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
            const res: any = await convertToPurchase(id);
            const voucherId = res?.id ?? res?.voucherId;
            setConfirmConvert(false);
            if (voucherId) {
                router.push(`/purchase/create?id=${voucherId}`);
            } else {
                await load();
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to initialize purchase bill");
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative h-12 w-12 text-orange-600">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-current border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Auditing Procurement Order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center border-2 border-dashed border-orange-200 dark:border-orange-800">
                    <AlertCircle className="h-8 w-8 text-orange-300" />
                </div>
                <div className="max-w-xs space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs text-orange-600">Order Missing</h3>
                    <p className="text-sm text-slate-500 font-medium">The procurement order registry could not be located.</p>
                </div>
                <Button onClick={() => router.push("/purchase-orders")} variant="outline" className="rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest border-orange-100 text-orange-600 hover:bg-orange-50">
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
                        onClick={() => router.push("/purchase-orders")}
                        className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-widest mb-1"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Purchase Order Registry
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                            {order?.orderNo || "PO Draft"}
                        </h1>
                        <StatusBadge status={status} className="h-6 px-3" />
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-4 font-medium uppercase tracking-tight">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 opacity-50" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 opacity-50" /> Vendor: {order.partyName || "Unknown Supplier"}</span>
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
                        Print Order
                    </Button>

                    {(status === "open" || status === "draft") && (
                        <Button
                            onClick={() => setConfirmConvert(true)}
                            disabled={actionLoading}
                            className="rounded-2xl h-11 bg-orange-600 text-white font-black text-xs uppercase tracking-widest px-8 shadow-xl shadow-orange-500/20 hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all"
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Record Purchase Bill
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-11 w-11 p-0 rounded-2xl border-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px]">
                            {status === "open" && (
                                <DropdownMenuItem
                                    onClick={() => setConfirmCancel(true)}
                                    className="flex items-center gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-xl px-3 py-2.5 font-bold text-xs uppercase tracking-widest"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Cancel Order
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => router.push(`/purchase-orders/create?id=${id}`)}
                                className="flex items-center gap-2 text-slate-700 rounded-xl px-3 py-2.5 font-bold text-xs uppercase tracking-widest"
                            >
                                Edit Order Registry
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
                    {/* Matrix View */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <DocumentField label="Vendor Partner" value={order.partyName || "Unknown Vendor"} isOrange />
                            <DocumentField label="Order Date" value={orderDate.primary} subLabel={orderDate.secondary} isOrange />
                            <DocumentField label="Inward Date" value={deliveryDate?.primary || "TBD"} subLabel={deliveryDate?.secondary} isOrange />
                            <DocumentField label="Order Total" value={<MoneyText value={order.total} />} isTotal />
                        </div>

                        {order.memo && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Remarks</span>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                    {order.memo}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stock Registry */}
                    <div className="rounded-[32px] border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                            <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Procurement Registry</h3>
                            <div className="flex gap-3">
                                <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-orange-100">
                                    {order.items?.length || 0} Items
                                </div>
                                {order.fulfilledAmount > 0 && (
                                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-emerald-100">
                                        Billed: <MoneyText value={order.fulfilledAmount} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Stock Item / Description</th>
                                        <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Qty</th>
                                        <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Unit Cost</th>
                                        <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {(order.items || []).map((l: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-orange-50/10 dark:hover:bg-orange-900/10 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{l.itemName || l.itemId}</span>
                                                    {l.description && <span className="text-[11px] text-slate-400 font-medium italic mt-0.5">{l.description}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                                                {l.qty}
                                            </td>
                                            <td className="px-8 py-5 text-right font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                                                <MoneyText value={l.rate} />
                                            </td>
                                            <td className="px-8 py-5 text-right tabular-nums">
                                                <span className="font-black text-slate-900 dark:text-white text-base"><MoneyText value={l.qty * l.rate} /></span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-4">Vendor Terms</h3>
                            <div className="text-xs text-slate-500 font-medium leading-relaxed bg-orange-50/30 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100/50 dark:border-orange-800/50 italic">
                                {order.terms || "Standard procurement and payment terms apply."}
                            </div>
                        </div>

                        <div className="rounded-[32px] border border-orange-100 bg-orange-600 p-8 shadow-2xl text-white relative overflow-hidden group border-none">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <PackageSearch className="h-40 w-40" />
                            </div>
                            <div className="relative space-y-4">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-orange-200">
                                    <span>Stock Value</span>
                                    <span className="text-white"><MoneyText value={order.total - (order.sundries?.reduce((s: number, r: any) => s + r.amount, 0) || 0)} /></span>
                                </div>
                                {(order.sundries || []).map((s: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs font-bold uppercase tracking-widest text-orange-200/80">
                                        <span>{s.name} {s.rate ? `(${s.rate}%)` : ""}</span>
                                        <span className={s.type === 'less' ? "text-red-200" : "text-emerald-200"}>
                                            {s.type === 'less' ? "- " : "+ "}
                                            <MoneyText value={s.amount} />
                                        </span>
                                    </div>
                                ))}
                                <div className="h-px bg-white/20 my-6" />
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">Total Commitment</span>
                                        <div className="text-3xl font-black tabular-nums tracking-tighter">
                                            <MoneyText value={order.total} />
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <ShoppingCart className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Procurement Timeline */}
                    <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Order Lifecycle</h3>
                        <div className="space-y-8">
                            <TimelineItem
                                icon={Calendar}
                                label="Order Released"
                                value={orderDate.primary}
                                isActive
                            />
                            <TimelineItem
                                icon={ShoppingCart}
                                label="Inward Billing"
                                value={order.fulfilledAmount >= order.total ? "Fully Billed" : order.fulfilledAmount > 0 ? "Billed" : "Awaiting Bill"}
                                isActive={order.fulfilledAmount > 0}
                            />
                            <TimelineItem
                                icon={PackageSearch}
                                label="Inventory Sync"
                                value={order.status === 'fulfilled' ? "Complete" : "Pending Receipt"}
                                isActive={order.status === 'fulfilled'}
                                isLast
                            />
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-900/50">
                        <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-6 italic">Registry Metadata</h3>
                        <div className="space-y-6">
                            <InfoRow
                                icon={User}
                                label="Verified By"
                                value={order.createdByUser?.name || "Registry Scan"}
                            />
                            <InfoRow
                                icon={AlertCircle}
                                label="Internal UID"
                                value={id}
                                isMono
                            />
                            {order.vendorRef && (
                                <InfoRow
                                    icon={FileText}
                                    label="Vendor Quote Ref"
                                    value={order.vendorRef}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmCancel}
                title="Cancel procurement order?"
                description="This will mark the order as cancelled. Useful if the vendor cannot fulfill the item requirements."
                confirmText="Cancel Order"
                variant="danger"
                onConfirm={onCancel}
                onCancel={() => setConfirmCancel(false)}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={confirmConvert}
                title="Record Purchase Bill?"
                description="This will initialize a purchase bill based on items in this order. You can adjust the billed quantities on the next screen."
                confirmText="Create Bill Draft"
                onConfirm={onConvert}
                onCancel={() => setConfirmConvert(false)}
                loading={actionLoading}
            />
        </div>
    );
}

function DocumentField({ label, value, subLabel, isTotal = false, isOrange = false }: { label: string; value: any; subLabel?: string; isTotal?: boolean; isOrange?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className="flex flex-col">
                <div className={cn(
                    "font-black text-slate-800 dark:text-slate-100 tracking-tight",
                    isTotal ? "text-xl text-orange-600 dark:text-orange-400" : "text-sm",
                    isOrange && !isTotal && "text-orange-700/80 dark:text-orange-300"
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
        <div className="flex items-start gap-4">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                <Icon className="h-4 w-4 text-orange-500" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className={cn(
                    "font-bold text-slate-800 dark:text-slate-200 truncate text-[13px]",
                    isMono && "font-mono"
                )}>{value}</p>
            </div>
        </div>
    );
}

function TimelineItem({ icon: Icon, label, value, isActive = false, isLast = false }: { icon: any, label: string, value: string, isActive?: boolean, isLast?: boolean }) {
    return (
        <div className="relative">
            <div className="flex items-start gap-4">
                <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 z-10",
                    isActive
                        ? "bg-orange-600 border-orange-500 shadow-md shadow-orange-200"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                )}>
                    <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-300")} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                    <p className={cn(
                        "font-bold truncate",
                        isActive ? "text-sm text-slate-800 dark:text-slate-100" : "text-xs text-slate-400"
                    )}>{value}</p>
                </div>
            </div>
            {!isLast && (
                <div className={cn(
                    "absolute top-9 left-[17px] w-0.5 h-8 z-0",
                    isActive ? "bg-orange-100 dark:bg-orange-900/30" : "bg-slate-50 dark:bg-slate-900/30"
                )} />
            )}
        </div>
    );
}
