"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    ChevronRight,
    ChevronDown,
    Package,
    ShoppingBag,
    FileText,
    Clock,
    CheckCircle
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listSalesOrders, type SalesOrderRecord } from "@/lib/api/sales-orders";
import { getSettings, subscribeSettings } from "@/lib/store/settings";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@lekhaly/ui";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

export default function SalesOrdersListPage() {
    const navigate = useNavigate();
    const [settings, setSettings] = React.useState(getSettings());

    React.useEffect(() => {
        const unsubscribe = subscribeSettings((next) => setSettings(next));
        return () => { unsubscribe(); };
    }, []);

    const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<any[]>([]);
    const [filters, setFilters] = React.useState({
        q: "",
        status: "all",
        from: null as Date | null,
        to: null as Date | null,
    });
    const [error, setError] = React.useState<string | null>(null);
    const [expandedRow, setExpandedRow] = React.useState<string | null>(null);

    /* Pagination State */
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(50);
    const [totalRecords, setTotalRecords] = React.useState(0);

    /* Density State */
    const [compactMode, setCompactMode] = React.useState(false);

    /* Column Visibility State */
    const [visibleColumns, setVisibleColumns] = React.useState<string[]>([
        "sno", "date", "orderNo", "customer", "amount", "delivery", "fulfillment", "status"
    ]);

    const columnOptions = [
        { key: "sno", label: "S.No", defaultVisible: true },
        { key: "date", label: "Date", defaultVisible: true },
        { key: "orderNo", label: "Order No", defaultVisible: true },
        { key: "customer", label: "Customer / Client", defaultVisible: true },
        { key: "amount", label: "Order Amount", defaultVisible: true },
        { key: "delivery", label: "Delivery Date", defaultVisible: true },
        { key: "fulfillment", label: "Fulfillment Status", defaultVisible: true },
        { key: "status", label: "Status", defaultVisible: true },
    ];

    /* Summary Metrics */
    const metrics = React.useMemo(() => {
        const totalAmount = data.reduce((acc, q) => acc + Number(q.total || 0), 0);
        const fulfilledCount = data.filter(q => q.status === "fulfilled").length;
        return { totalAmount, fulfilledCount };
    }, [data]);

    async function load() {
        setLoading(true);
        try {
            const res = await listSalesOrders({
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : (filters.status as any),
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: pageSize,
                skip: (page - 1) * pageSize,
            });

            if (res && res.data && res.meta) {
                setData(res.data);
                setTotalRecords(res.meta.total);
                setTotalPages(res.meta.lastPage);
            } else {
                const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
                setData(list);
                setTotalRecords(list.length);
                setTotalPages(1);
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to load sales orders");
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        setPage(1);
    }, [filters, pageSize]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, page, pageSize]);

    const filterOptions = [
        {
            key: "status",
            label: "Order Status",
            options: [
                { value: "draft", label: "Draft" },
                { value: "open", label: "Open" },
                { value: "fulfilled", label: "Fulfilled" },
                { value: "cancelled", label: "Cancelled" },
            ]
        }
    ];

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({
            ...prev,
            status: newFilters.status?.[0] || prev.status,
            from: newFilters.dateRange?.from || null,
            to: newFilters.dateRange?.to || null,
        }));
    };

    const getFulfillmentBadge = (order: SalesOrderRecord) => {
        if (order.status === "fulfilled") {
            return <div className="flex flex-col items-center">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold uppercase tracking-tighter">Fully Invoiced</span>
            </div>;
        }
        if (order.fulfilledAmount && order.fulfilledAmount > 0) {
            const pct = Math.round((Number(order.fulfilledAmount) / Number(order.total)) * 100);
            return <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Partial {pct}%</span>
            </div>;
        }
        return <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold uppercase tracking-tighter">Pending</span>;
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Sales Orders"
                    description="Manage customer orders and track fulfillment status."
                    actions={
                        <Button
                            onClick={() => navigate("/sales-orders/create")}
                            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8 h-11 transition-all active:scale-95 border-none"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Order
                        </Button>
                    }
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant={compactMode ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setCompactMode(!compactMode)}
                        className="rounded-xl h-9 px-3 text-xs font-bold uppercase tracking-wider hidden md:flex"
                    >
                        {compactMode ? "Comfortable" : "Compact"}
                    </Button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Total Orders:</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg shadow-sm">{totalRecords}</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Order Value</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white mt-1"><MoneyText value={metrics.totalAmount} /></span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                        <ShoppingBag className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Fulfilled Orders</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white mt-1">{metrics.fulfilledCount}</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                        <CheckCircle className="h-5 w-5" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300">Order Flow Sync</span>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="font-bold text-sm italic opacity-90 underline underline-offset-4 decoration-indigo-500">Processing Active</span>
                    </div>
                </div>
            </div>

            <AdvancedFilterBar
                onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
                onFilterChange={handleFilterChange}
                filterOptions={filterOptions}
                columnOptions={columnOptions}
                onVisibleColumnsChange={setVisibleColumns}
                className="border-indigo-100 dark:border-indigo-800/50"
            />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-900/30"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest text-[10px] font-black">Scanning Registry...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    {visibleColumns.includes("sno") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>S.No</th>}
                                    {visibleColumns.includes("date") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Date ({calendarFmt.toUpperCase()})</th>}
                                    {visibleColumns.includes("orderNo") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Order No</th>}
                                    {visibleColumns.includes("customer") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Customer / Client</th>}
                                    {visibleColumns.includes("amount") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right", compactMode ? "py-3" : "py-4")}>Amount</th>}
                                    {visibleColumns.includes("delivery") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Expected Delivery</th>}
                                    {visibleColumns.includes("fulfillment") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center", compactMode ? "py-3" : "py-4")}>Fulfillment</th>}
                                    {visibleColumns.includes("status") && <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center", compactMode ? "py-3" : "py-4")}>Status</th>}
                                    <th className={cn("px-6 w-10", compactMode ? "py-3" : "py-4")}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {data.map((order, index) => {
                                    const dateInfo = getDateDisplay({ ad: order.orderDate, bs: order.orderDateBs, format: calendarFmt });
                                    const deliveryInfo = order.expectedDelivery ? getDateDisplay({ ad: order.expectedDelivery, bs: order.expectedDeliveryBs, format: calendarFmt }) : null;
                                    const sNo = (page - 1) * pageSize + index + 1;
                                    const totalItems = order.items?.length || 0;

                                    const py = compactMode ? "py-2.5" : "py-5";
                                    const isExpanded = expandedRow === order.id;

                                    return (
                                        <React.Fragment key={order.id}>
                                            <tr className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                                                {visibleColumns.includes("sno") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap font-bold text-slate-500`}>
                                                        {sNo}
                                                    </td>
                                                )}
                                                {visibleColumns.includes("date") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap`}>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                                                {dateInfo.primary}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-medium tracking-tight">
                                                                {dateInfo.secondary}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("orderNo") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap`}>
                                                        <span
                                                            onClick={() => navigate(`/sales-orders/create?id=${order.id}`)}
                                                            className="font-black text-slate-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer"
                                                        >
                                                            {order.orderNo || `DRAFT-${order.id.slice(0, 4)}`}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("customer") && (
                                                    <td
                                                        className={`px-6 ${py} cursor-pointer`}
                                                        onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                                                    >
                                                        <div className="flex flex-col max-w-[250px]">
                                                            <span className="truncate font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors" title={order.partyName}>
                                                                {order.partyName || "Unknown Customer"}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                {order.customerPoRef && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-tight">PO: {order.customerPoRef}</span>
                                                                )}
                                                                {totalItems > 0 && (
                                                                    <span className="text-[9px] font-medium text-slate-400 italic">
                                                                        ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("amount") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap text-right`}>
                                                        <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                                                            <MoneyText value={order.total} />
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes("delivery") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap`}>
                                                        {deliveryInfo ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                                                                    {deliveryInfo.primary}
                                                                </span>
                                                                <span className="text-[9px] text-slate-400 font-medium tracking-tight">
                                                                    {deliveryInfo.secondary}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 font-black">—</span>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.includes("fulfillment") && (
                                                    <td className={`px-6 ${py} text-center`}>
                                                        {getFulfillmentBadge(order)}
                                                    </td>
                                                )}
                                                {visibleColumns.includes("status") && (
                                                    <td className={`px-6 ${py} whitespace-nowrap text-center`}>
                                                        <StatusBadge status={order.status as DocStatus} />
                                                    </td>
                                                )}
                                                <td className={`px-6 ${py} text-right`}>
                                                    <div className="text-slate-300 group-hover:text-indigo-400 transition-all">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && order.items && order.items.length > 0 && (
                                                <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                                                    <td colSpan={visibleColumns.length + 1} className="px-6 py-4">
                                                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Ordered Items Registry</h4>
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                                                        <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Product / Service</th>
                                                                        <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Specs</th>
                                                                        <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Quantity</th>
                                                                        <th className="text-right py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Unit Rate</th>
                                                                        <th className="text-right py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Ext. Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                                    {order.items.map((item: any, idx: number) => (
                                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                            <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                                                                                {item.itemName || item.itemId}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400 italic">
                                                                                {item.description || "-"}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-center font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                                                                                {item.qty}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                                                                                <MoneyText value={item.rate} />
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                                                                                <MoneyText value={item.qty * item.rate} />
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>

                                                            {order.memo && (
                                                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Order Internal Memo</h5>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                                        {order.memo}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 px-6 text-center space-y-4">
                        <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-4 border-dotted border-slate-200 dark:border-slate-800">
                            <Package className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm text-indigo-600">No Sales Orders Found</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">Your order registry is empty. Start by creating a new customer sales order.</p>
                        </div>
                        <Button
                            onClick={() => setFilters({ q: "", status: "all", from: null, to: null })}
                            className="bg-indigo-600 rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                        >
                            Clear Filter Logic
                        </Button>
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Page Size:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1 outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                            registry {page} / {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



