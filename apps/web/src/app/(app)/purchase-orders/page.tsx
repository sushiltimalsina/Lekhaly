"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { listPurchaseOrders, type PurchaseOrderRecord } from "@/lib/api/purchase-orders";
import StatusBadge from "@/components/app/status-badge";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { Plus, ChevronRight, FileText, Download, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

export default function PurchaseOrdersListPage() {
    const router = useRouter();
    const { dateFormat } = useDateFormat();

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<PurchaseOrderRecord[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const [filters, setFilters] = React.useState({
        q: "",
        status: "all",
        from: null as Date | null,
        to: null as Date | null,
    });

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listPurchaseOrders({
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : (filters.status as any),
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: 100,
            });
            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            setData(list);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load purchase orders");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const filterOptions = [
        {
            key: "status",
            label: "Order Status",
            options: [
                { value: "draft", label: "Draft" },
                { value: "open", label: "Open" },
                { value: "fulfilled", label: "Fulfilled" },
                { value: "cancelled", label: "Cancelled" },
            ],
        },
    ];

    const handleFilterChange = (newFilters: any) => {
        setFilters((prev) => ({
            ...prev,
            status: newFilters.status?.[0] || prev.status,
            from: newFilters.dateRange?.from || null,
            to: newFilters.dateRange?.to || null,
        }));
    };

    const getFulfillmentBadge = (order: PurchaseOrderRecord) => {
        if (order.status === "fulfilled") {
            return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-black uppercase">Received</span>;
        }
        if (order.fulfilledAmount && order.fulfilledAmount > 0) {
            const pct = Math.round((order.fulfilledAmount / order.total) * 100);
            return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-black uppercase">Partial {pct}%</span>;
        }
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-black uppercase">Pending</span>;
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Purchase Orders"
                description="Manage vendor orders and track procurement fulfillment."
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-2xl border-2 h-11 px-6 font-black text-[10px] uppercase tracking-widest hidden sm:flex">
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                        <Button
                            onClick={() => router.push("/purchase-orders/create")}
                            className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 dark:shadow-none h-11 px-8 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Order
                        </Button>
                    </div>
                }
            />

            <AdvancedFilterBar
                onSearch={(q) => setFilters((prev) => ({ ...prev, q }))}
                onFilterChange={handleFilterChange}
                filterOptions={filterOptions}
            />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Loading Purchase Orders...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Order Info</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Vendor</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Planned Delivery</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>
                                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Fulfillment</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {data.map((order) => {
                                    const orderDateInfo = getDateDisplay({ ad: order.orderDate, bs: order.orderDateBs, format: dateFormat });
                                    const deliveryDateInfo = order.expectedDelivery ? getDateDisplay({ ad: order.expectedDelivery, bs: order.expectedDeliveryBs, format: dateFormat }) : null;

                                    return (
                                        <tr
                                            key={order.id}
                                            onClick={() => router.push(`/purchase-orders/${order.id}`)}
                                            className="group cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0 border border-orange-100/50 dark:border-orange-800/50">
                                                        <PackageSearch className="h-4 w-4 text-orange-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors uppercase tracking-widest">
                                                            {order.orderNo || "PO-" + order.id.slice(0, 6)}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{orderDateInfo.primary}</span>
                                                            <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                                                            <span className="text-[9px] text-slate-400 font-medium">{orderDateInfo.secondary}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{order.partyName || "Unknown Vendor"}</span>
                                                    {order.vendorRef && (
                                                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">Ref: {order.vendorRef}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {deliveryDateInfo ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{deliveryDateInfo.primary}</span>
                                                        <span className="text-[10px] text-slate-400">{deliveryDateInfo.secondary}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right whitespace-nowrap">
                                                <span className="font-black text-slate-900 dark:text-white text-base tabular-nums">
                                                    <MoneyText value={Number(order.total || 0)} />
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <StatusBadge status={order.status as any} />
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                {getFulfillmentBadge(order)}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 px-6 text-center space-y-4">
                        <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-4 border-dotted border-slate-200 dark:border-slate-800">
                            <PackageSearch className="h-10 w-10 text-slate-200" />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">No Purchase Orders Found</h3>
                            <p className="text-sm text-slate-500 font-medium">No purchase orders match your current filters.</p>
                        </div>
                        <Button
                            onClick={() => setFilters({ q: "", status: "all", from: null, to: null })}
                            variant="outline"
                            className="rounded-2xl h-10 px-8 font-black text-xs uppercase tracking-widest border-2"
                        >
                            Reset Filters
                        </Button>
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    <p>Log: {data.length} procurement records available</p>
                    <div className="flex items-center gap-1.5 font-bold text-orange-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        <span>Vendor Sync Active</span>
                    </div>
                </div>
            )}
        </div>
    );
}

