// apps/desktop/src/pages/sales-orders/index.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    ChevronRight,
    ShoppingBag,
    CheckCircle,
    Package,
    Clock,
    AlertCircle
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listSalesOrders, type SalesOrderRecord } from "@/lib/api/sales-orders";
import { getSettings } from "@/lib/store/settings";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@lekhaly/ui";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable from "@/components/app/data-table";

export default function SalesOrdersListPage() {
    const navigate = useNavigate();
    const settings = getSettings();
    const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<SalesOrderRecord[]>([]);
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
            const res = await listSalesOrders({
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
            console.error("Failed to load sales orders", e);
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

    const getFulfillmentBadge = (order: SalesOrderRecord) => {
        if (order.status === "fulfilled") {
            return (
                <div className="flex flex-col items-center">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase tracking-tighter shadow-sm border border-emerald-200/50">Fully Invoiced</span>
                </div>
            );
        }
        if (order.fulfilledAmount && order.fulfilledAmount > 0) {
            const pct = Math.round((Number(order.fulfilledAmount) / Number(order.total)) * 100);
            return (
                <div className="flex flex-col items-center gap-1">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Partial {pct}%</span>
                </div>
            );
        }
        return <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-tighter border border-slate-200/30">Pending</span>;
    };

    const columns = [
        {
            key: "date",
            header: "Date",
            cell: (order: SalesOrderRecord) => {
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
            cell: (order: SalesOrderRecord) => (
                <span className="font-black text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer" onClick={() => navigate(`/sales-orders/view/${order.id}`)}>
                    {order.orderNo || `DRAFT-${order.id.slice(0, 4)}`}
                </span>
            )
        },
        {
            key: "party",
            header: "Customer / Client",
            cell: (order: SalesOrderRecord) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 line-clamp-1">{order.partyName || "Unknown Customer"}</span>
                    {order.customerPoRef && (
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">PO: {order.customerPoRef}</span>
                    )}
                </div>
            )
        },
        {
            key: "total",
            header: "Amount",
            align: "right" as const,
            cell: (order: SalesOrderRecord) => (
                <span className="font-black text-slate-900 tabular-nums">
                    <MoneyText value={order.total} />
                </span>
            )
        },
        {
            key: "delivery",
            header: "Exp. Delivery",
            cell: (order: SalesOrderRecord) => {
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
            header: "Fulfillment",
            align: "center" as const,
            cell: (order: SalesOrderRecord) => getFulfillmentBadge(order)
        },
        {
            key: "status",
            header: "Status",
            align: "center" as const,
            cell: (order: SalesOrderRecord) => <StatusBadge status={order.status as DocStatus} />
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageHeader
                    title="Sales Orders"
                    description="Monitor customer orders and manage fulfillment pipelines."
                    actions={
                        <Button
                            onClick={() => navigate("/sales-orders/create")}
                            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 px-8 h-12 font-black text-xs uppercase tracking-widest transition-all active:scale-95 italic"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Launch New Order
                        </Button>
                    }
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[28px] border-2 border-slate-50 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Pipeline Value</span>
                        <div className="text-2xl font-black text-slate-900"><MoneyText value={metrics.totalAmount} /></div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[28px] border-2 border-slate-50 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-all">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fulfilled Count</span>
                        <div className="text-2xl font-black text-slate-900">{metrics.fulfilledCount} <span className="text-xs text-slate-300 font-bold ml-1">ORDERS</span></div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[28px] shadow-2xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <Package className="h-20 w-20 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Sync Intelligence</span>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        <span className="text-white font-bold text-sm italic">Automated Dispatch Queue Active</span>
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
                onRowClick={(row) => navigate(`/sales-orders/view/${row.id}`)}
                emptyText="No sales orders found"
            />
        </div>
    );
}
