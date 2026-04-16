// apps/desktop/src/pages/purchase-orders/index.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    ChevronRight,
    Truck,
    PackageSearch,
    CheckSquare,
    Clock,
    AlertCircle,
    ShoppingCart
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listPurchaseOrders, type PurchaseOrderRecord } from "@/lib/api/purchase-orders";
import { getSettings } from "@/lib/store/settings";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable from "@/components/app/data-table";

export default function PurchaseOrdersListPage() {
    const navigate = useNavigate();
    const settings = getSettings();
    const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<PurchaseOrderRecord[]>([]);
    const [totalRecords, setTotalRecords] = React.useState(0);
    const [filters, setFilters] = React.useState({
        q: "",
        status: "all",
        from: null as Date | null,
        to: null as Date | null,
    });
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(50);

    const load = async () => {
        setLoading(true);
        try {
            const res = await listPurchaseOrders({
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : (filters.status as any),
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: pageSize,
                skip: (page - 1) * pageSize,
            });

            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            const meta = (res as any)?.meta;
            
            setData(list);
            setTotalRecords(meta?.total || list.length);
        } catch (e) {
            console.error("Failed to load purchase orders", e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        load();
    }, [filters, page, pageSize]);

    const metrics = React.useMemo(() => {
        const totalAmount = data.reduce((acc, q) => acc + Number(q.total || 0), 0);
        const fulfilledCount = data.filter(q => q.status === "fulfilled").length;
        return { totalAmount, fulfilledCount };
    }, [data]);

    const getFulfillmentBadge = (order: PurchaseOrderRecord) => {
        if (order.status === "fulfilled") {
            return (
                <div className="flex flex-col items-center">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase tracking-tighter shadow-sm border border-emerald-200/50 text-[10px]">Fully Received</span>
                </div>
            );
        }
        if (order.fulfilledAmount && order.fulfilledAmount > 0) {
            const pct = Math.round((Number(order.fulfilledAmount) / Number(order.total)) * 100);
            return (
                <div className="flex flex-col items-center gap-1">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">Billed {pct}%</span>
                </div>
            );
        }
        return <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-tighter border border-slate-200/30 text-[10px]">Open</span>;
    };

    const columns = [
        {
            key: "date",
            header: "Date",
            cell: (order: PurchaseOrderRecord) => {
                const d = getDateDisplay({ ad: order.orderDate, bs: order.orderDateBs, format: calendarFmt });
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{d.primary}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{d.secondary}</span>
                    </div>
                );
            }
        },
        {
            key: "orderNo",
            header: "Order No",
            cell: (order: PurchaseOrderRecord) => (
                <span className="font-black text-orange-600 hover:text-orange-800 transition-colors cursor-pointer" onClick={() => navigate(`/purchase-orders/view/${order.id}`)}>
                    {order.orderNo || `PO-DRAFT-${order.id.slice(0, 4)}`}
                </span>
            )
        },
        {
            key: "vendor",
            header: "Vendor / Supplier",
            cell: (order: PurchaseOrderRecord) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 line-clamp-1">{order.partyName || "Unknown Supplier"}</span>
                    {order.vendorRef && (
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Ref: {order.vendorRef}</span>
                    )}
                </div>
            )
        },
        {
            key: "total",
            header: "Procurement Value",
            align: "right" as const,
            cell: (order: PurchaseOrderRecord) => (
                <span className="font-black text-slate-900 tabular-nums">
                    <MoneyText value={order.total} />
                </span>
            )
        },
        {
            key: "delivery",
            header: "Exp. Inward",
            cell: (order: PurchaseOrderRecord) => {
                if (!order.expectedDelivery) return <span className="text-slate-300 font-black">—</span>;
                const d = getDateDisplay({ ad: order.expectedDelivery, bs: order.expectedDeliveryBs, format: calendarFmt });
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{d.primary}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{d.secondary}</span>
                    </div>
                );
            }
        },
        {
            key: "fulfillment",
            header: "Inward Status",
            align: "center" as const,
            cell: (order: PurchaseOrderRecord) => getFulfillmentBadge(order)
        },
        {
            key: "status",
            header: "Status",
            align: "center" as const,
            cell: (order: PurchaseOrderRecord) => <StatusBadge status={order.status as DocStatus} />
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageHeader
                    title="Purchase Orders"
                    description="Orchestrate procurement and track vendor fulfillment pipelines."
                    actions={
                        <Button
                            onClick={() => navigate("/purchase-orders/create")}
                            className="rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-100 px-8 h-12 font-black text-xs uppercase tracking-widest transition-all active:scale-95 italic border-none"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Initiate Procurement
                        </Button>
                    }
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[28px] border-2 border-slate-50 shadow-sm flex items-center justify-between group hover:border-orange-100 transition-all">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Purchase Commitment</span>
                        <div className="text-2xl font-black text-slate-900"><MoneyText value={metrics.totalAmount} /></div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                        <Truck className="h-6 w-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[28px] border-2 border-slate-50 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-all">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Received & Billed</span>
                        <div className="text-2xl font-black text-slate-900">{metrics.fulfilledCount} <span className="text-xs text-slate-300 font-bold ml-1">ORDERS</span></div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <CheckSquare className="h-6 w-6" />
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[28px] shadow-2xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <ShoppingCart className="h-20 w-20 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Procurement Intel</span>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                        <span className="text-white font-bold text-sm italic">Vendor Inventory Sync Active</span>
                    </div>
                </div>
            </div>

            <AdvancedFilterBar
                onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
                onFilterChange={(f) => setFilters(prev => ({ 
                    ...prev, 
                    status: f.status?.[0] || "all",
                    from: f.dateRange?.from || null,
                    to: f.dateRange?.to || null
                }))}
                filterOptions={[
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
                ]}
            />

            <DataTable
                columns={columns}
                rows={data}
                loading={loading}
                onRowClick={(row) => navigate(`/purchase-orders/view/${row.id}`)}
                emptyText="No purchase orders found"
            />
        </div>
    );
}
