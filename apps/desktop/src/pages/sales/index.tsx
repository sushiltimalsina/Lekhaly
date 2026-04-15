// apps/desktop/src/pages/sales/index.tsx
import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { listInvoices } from "@/lib/api/invoices";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { Plus, ChevronRight, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getSettings, subscribeSettings } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

export default function SalesListPage() {
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
            const res = await listInvoices({
                type: "sales",
                q: filters.q || undefined,
                status: filters.status === "all" ? undefined : filters.status,
                from: filters.from || undefined,
                to: filters.to || undefined,
                take: 100
            });
            const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
            setData(list);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load sales invoices");
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
        { key: "date", label: "Invoice Date", defaultVisible: true },
        { key: "invoiceNo", label: "Invoice No", defaultVisible: true },
        { key: "party", label: "Customer Name", defaultVisible: true },
        { key: "amount", label: "Amount", defaultVisible: true },
        { key: "status", label: "Status", defaultVisible: true },
    ];

    const [visibleColumns, setVisibleColumns] = React.useState<string[]>(
        columnOptions.filter(c => c.defaultVisible).map(c => c.key)
    );

    const isVisible = (key: string) => visibleColumns.includes(key);

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Sales Invoices"
                description="Manage your business sales and customer billing."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 hidden sm:flex">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            onClick={() => navigate("/sales/create")}
                            className="h-10 px-6 rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Invoice
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
            />

            <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-200/50">
                {loading && data.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Registry...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    {isVisible("date") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>}
                                    {isVisible("invoiceNo") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Invoice No</th>}
                                    {isVisible("party") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Customer</th>}
                                    {isVisible("amount") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount</th>}
                                    {isVisible("status") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>}
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.map((item) => {
                                    const dateInfo = getDateDisplay({ ad: item.date, bs: item.dateBs, format: calendarFmt });
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => navigate(`/sales/view/${item.id}`)}
                                            className="group cursor-pointer hover:bg-slate-50 transition-colors"
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
                                                    {item.invoiceNo || "Draft"}
                                                </td>
                                            )}
                                            {isVisible("party") && (
                                                <td className="px-6 py-4 font-bold text-slate-700">{item.partyName || "Unknown"}</td>
                                            )}
                                            {isVisible("amount") && (
                                                <td className="px-6 py-4 text-right font-black text-primary text-base">
                                                    <MoneyText value={Number(item.total || 0)} />
                                                </td>
                                            )}
                                            {isVisible("status") && (
                                                <td className="px-6 py-4 text-center">
                                                    <StatusBadge status={item.status as DocStatus} />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <p className="text-sm font-bold text-slate-400">No invoices found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
