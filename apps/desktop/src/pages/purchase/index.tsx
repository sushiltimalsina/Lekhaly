// apps/desktop/src/pages/purchase/index.tsx
import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { listVouchers } from "@/lib/api/vouchers";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { Plus, ChevronRight, ShoppingCart, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getSettings, subscribeSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

export default function PurchaseListPage() {
    const navigate = useNavigate();
    const { dateFormat } = useDateFormat();
    const [settings, setSettings] = React.useState(getSettings());
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const [filters, setFilters] = React.useState({
        q: "",
        status: "all",
        from: null as Date | null,
        to: null as Date | null,
    });

    React.useEffect(() => {
        const unsubscribe = subscribeSettings((next) => setSettings(next));
        return () => { unsubscribe(); };
    }, []);

    const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await listVouchers({
                type: "purchase",
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : (filters.status as any),
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: 100
            });
            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            setData(list);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load purchases");
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
            label: "Status",
            options: [
                { value: "draft", label: "Draft" },
                { value: "posted", label: "Posted" },
                { value: "void", label: "Void" },
            ]
        }
    ];

    const columnOptions = [
        { key: "date", label: "Voucher Date", defaultVisible: true },
        { key: "invoiceNo", label: "Vendor Invoice", defaultVisible: true },
        { key: "party", label: "Supplier", defaultVisible: true },
        { key: "amount", label: "Total Amount", defaultVisible: true },
        { key: "status", label: "Status", defaultVisible: true },
    ];

    const [visibleColumns, setVisibleColumns] = React.useState<string[]>(
        columnOptions.filter(c => c.defaultVisible).map(c => c.key)
    );

    const isVisible = (key: string) => visibleColumns.includes(key);

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Purchase Registry"
                description="Monitor vendor invoices, stock inward entries, and supplier liabilities."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 hidden sm:flex">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            onClick={() => navigate("/purchase/create")}
                            className="h-10 px-6 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-100"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Purchase
                        </Button>
                    </div>
                }
            />

            <AdvancedFilterBar
                onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
                onFilterChange={(f) => {
                    setFilters(prev => ({
                        ...prev,
                        status: f.status?.[0] || "all",
                        from: f.dateRange?.from || null,
                        to: f.dateRange?.to || null,
                    }));
                }}
                filterOptions={filterOptions}
                columnOptions={columnOptions}
                onVisibleColumnsChange={setVisibleColumns}
                className="border-orange-50"
            />

            <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-sm">
                {loading && data.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Stock Inward...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-orange-50/30 border-b border-slate-100">
                                <tr>
                                    {isVisible("date") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>}
                                    {isVisible("invoiceNo") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Vendor Invoice</th>}
                                    {isVisible("party") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Supplier</th>}
                                    {isVisible("amount") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount</th>}
                                    {isVisible("status") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>}
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.map((item) => {
                                    const dateInfo = getDateDisplay({ ad: item.voucherDate, bs: item.voucherDateBs, format: calendarFmt });
                                    const totalAmount = (item.lines || []).reduce((max: number, l: any) => Math.max(max, Number(l.credit || 0)), 0);
                                    
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => navigate(`/purchase/create?id=${item.id}`)}
                                            className="group cursor-pointer hover:bg-orange-50/20 transition-colors"
                                        >
                                            {isVisible("date") && (
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700">{dateInfo.primary}</span>
                                                        <span className="text-[9px] text-slate-400 font-medium">{dateInfo.secondary}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {isVisible("invoiceNo") && (
                                                <td className="px-6 py-4 font-bold text-slate-900 uppercase tracking-tight text-[11px]">
                                                    {item.vendorInvoiceNo || item.voucherNumber || "Draft"}
                                                </td>
                                            )}
                                            {isVisible("party") && (
                                                <td className="px-6 py-4 font-bold text-slate-700">{item.party?.name || "Unknown Vendor"}</td>
                                            )}
                                            {isVisible("amount") && (
                                                <td className="px-6 py-4 text-right font-black text-orange-600 text-base">
                                                    <MoneyText value={Number(totalAmount || 0)} />
                                                </td>
                                            )}
                                            {isVisible("status") && (
                                                <td className="px-6 py-4 text-center">
                                                    <StatusBadge status={item.status as DocStatus} />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-400 transition-colors" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                            <ShoppingCart className="h-6 w-6 text-slate-200" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No purchase records found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
