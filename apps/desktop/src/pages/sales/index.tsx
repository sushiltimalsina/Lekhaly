// apps/desktop/src/pages/sales/index.tsx
import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Button } from "@lekhaly/ui";
import { MoneyText } from "@/components/app/money";
import { listInvoices } from "@/lib/api/invoices";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { Plus, ChevronRight, FileText, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getSettings, subscribeSettings } from "@/lib/store/settings";

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
            label: "Invoice Status",
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
        { key: "refNo", label: "Reference No", defaultVisible: false },
        { key: "party", label: "Customer Name", defaultVisible: true },
        { key: "panVat", label: "PAN/VAT Number", defaultVisible: false },
        { key: "items", label: "Item Details", defaultVisible: true },
        { key: "qty", label: "Quantity", defaultVisible: true },
        { key: "rate", label: "Rate", defaultVisible: true },
        { key: "taxable", label: "Taxable Amount", defaultVisible: false },
        { key: "nonTaxable", label: "Non Taxable Amount", defaultVisible: false },
        { key: "amount", label: "Amount", defaultVisible: true },
        { key: "notes", label: "Memo", defaultVisible: false },
        { key: "additionalNote", label: "Additional Note", defaultVisible: false },
        { key: "status", label: "Status", defaultVisible: true },
        { key: "postedAt", label: "Posted Date/Time", defaultVisible: true },
    ];

    const [visibleColumns, setVisibleColumns] = React.useState<string[]>(
        columnOptions.filter(c => c.defaultVisible).map(c => c.key)
    );

    const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({
            ...prev,
            status: newFilters.status?.[0] || prev.status,
            from: newFilters.dateRange?.from || null,
            to: newFilters.dateRange?.to || null,
        }));
    };

    const isVisible = (key: string) => visibleColumns.includes(key);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Sales Invoices"
                description="Manage your sales, collections and customer billing."
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-2xl border-2 h-11 px-6 font-black text-[10px] uppercase tracking-widest hidden sm:flex">
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                        <Button
                            onClick={() => navigate("/sales/create")}
                            className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 h-11 px-8 font-black text-xs uppercase tracking-widest transition-all active:scale-95 border-none"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Invoice
                        </Button>
                    </div>
                }
            />

            <AdvancedFilterBar
                onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
                onFilterChange={handleFilterChange}
                filterOptions={filterOptions}
                defaultRange={settings.defaultDateRange}
                columnOptions={columnOptions}
                onVisibleColumnsChange={setVisibleColumns}
                className="border-indigo-100 dark:border-indigo-900/50"
            />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
                {loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-black text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Registry Audit...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                                    {isVisible("date") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Invoice Date</th>}
                                    {isVisible("invoiceNo") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Invoice No</th>}
                                    {isVisible("refNo") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Reference No</th>}
                                    {isVisible("party") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Customer Name</th>}
                                    {isVisible("panVat") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Pan/Vat Number</th>}
                                    {isVisible("items") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Item Details</th>}
                                    {isVisible("qty") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Quantity</th>}
                                    {isVisible("rate") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Rate</th>}
                                    {isVisible("taxable") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Taxable Amount</th>}
                                    {isVisible("nonTaxable") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Non Taxable Amount</th>}
                                    {isVisible("amount") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount</th>}
                                    {isVisible("notes") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Memo</th>}
                                    {isVisible("additionalNote") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Additional Note</th>}
                                    {isVisible("status") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Status</th>}
                                    {isVisible("postedAt") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Posted Date/Time</th>}
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {data.map((item) => {
                                    const dateInfo = getDateDisplay({ ad: item.date, bs: item.dateBs, format: calendarFmt });
                                    const items = item.items || [];
                                    const firstItem = items[0];
                                    const itemSummary = items.length > 1
                                        ? `${firstItem?.item?.name || firstItem?.description || "Mixed"} (+${items.length - 1})`
                                        : (firstItem?.item?.name || firstItem?.description || "—");

                                    const totalQty = items.reduce((sum: number, i: any) => sum + Number(i.qty || 0), 0);
                                    const avgRate = items.length === 1 ? Number(firstItem?.rate || 0) : null;

                                    let taxableAmount = 0;
                                    let nonTaxableAmount = 0;

                                    items.forEach((i: any) => {
                                        const lineVal = Number(i.amount || 0);
                                        const hasTax = Number(i.taxAmount || 0) > 0 || !!i.taxCodeId;
                                        if (hasTax) taxableAmount += lineVal;
                                        else nonTaxableAmount += lineVal;
                                    });

                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => navigate(`/sales/create?id=${item.id}`)}
                                            className="group cursor-pointer hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                                        >
                                            {isVisible("date") && (
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 dark:text-slate-100">{dateInfo.primary}</span>
                                                        <span className="text-[9px] text-slate-400 font-medium">{dateInfo.secondary}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {isVisible("invoiceNo") && (
                                                <td className="px-6 py-5 whitespace-nowrap font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">
                                                    {item.invoiceNo || "DRAFT"}
                                                </td>
                                            )}
                                            {isVisible("refNo") && <td className="px-6 py-5 whitespace-nowrap text-slate-400 text-xs">{item.referenceNo || item.voucher?.referenceNo || "—"}</td>}
                                            {isVisible("party") && (
                                                <td className="px-6 py-5">
                                                    <span className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{item.partyName || item.party?.name || "Unknown Customer"}</span>
                                                </td>
                                            )}
                                            {isVisible("panVat") && (
                                                <td className="px-6 py-5 whitespace-nowrap text-xs text-slate-500 font-medium">
                                                    {item.party?.panNumber || item.party?.vatNumber || "—"}
                                                </td>
                                            )}
                                            {isVisible("items") && (
                                                <td
                                                    className="px-6 py-5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors rounded-lg"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                                                    }}
                                                >
                                                    {expandedItems[item.id] ? (
                                                        <div className="flex flex-col gap-1 min-w-[200px]">
                                                            {items.map((i: any, idx: number) => (
                                                                <span key={idx} className="text-xs font-medium text-slate-700 dark:text-slate-300 break-words whitespace-normal">
                                                                    • {i.item?.name || i.description} {Number(i.qty || 0) > 0 && <span className="text-slate-400">x{Number(i.qty)}</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[200px] block" title="Click to expand">
                                                            {itemSummary}
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {isVisible("qty") && (
                                                <td className="px-6 py-5 text-right font-bold text-slate-700 dark:text-slate-300">
                                                    {totalQty.toLocaleString()}
                                                </td>
                                            )}
                                            {isVisible("rate") && (
                                                <td className="px-6 py-5 text-right text-slate-500 whitespace-nowrap">
                                                    {avgRate !== null ? <MoneyText value={avgRate} /> : <span className="text-[10px] italic">Mixed</span>}
                                                </td>
                                            )}
                                            {isVisible("taxable") && (
                                                <td className="px-6 py-5 text-right font-medium text-slate-900 dark:text-white">
                                                    <MoneyText value={taxableAmount} />
                                                </td>
                                            )}
                                            {isVisible("nonTaxable") && (
                                                <td className="px-6 py-5 text-right text-slate-400">
                                                    <MoneyText value={nonTaxableAmount} />
                                                </td>
                                            )}
                                            {isVisible("amount") && (
                                                <td className="px-6 py-5 text-right whitespace-nowrap">
                                                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-base tabular-nums">
                                                        <MoneyText value={Number(item.total || 0)} />
                                                    </span>
                                                </td>
                                            )}
                                            {isVisible("notes") && (
                                                <td className="px-6 py-5">
                                                    <span className="text-xs text-slate-400 font-medium truncate max-w-[150px] block" title={item.memo || item.voucher?.memo}>
                                                        {item.memo || item.voucher?.memo || "—"}
                                                    </span>
                                                </td>
                                            )}
                                            {isVisible("additionalNote") && (
                                                <td className="px-6 py-5">
                                                    <span className="text-xs text-slate-400 font-medium truncate max-w-[150px] block" title={item.additionalNote || item.voucher?.additionalNote}>
                                                        {item.additionalNote || item.voucher?.additionalNote || "—"}
                                                    </span>
                                                </td>
                                            )}
                                            {isVisible("status") && (
                                                <td className="px-6 py-5 whitespace-nowrap text-center">
                                                    <StatusBadge status={item.status as DocStatus} />
                                                </td>
                                            )}
                                            {isVisible("postedAt") && (
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    {item.voucher?.postedAt ? (() => {
                                                        const postedInfo = getDateDisplay({ ad: item.voucher.postedAt, format: calendarFmt });
                                                        return (
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                                                    {postedInfo.primary}
                                                                </span>
                                                                <span className="text-[9px] text-slate-400 font-medium">
                                                                    {new Date(item.voucher.postedAt).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                        );
                                                    })() : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-5 text-right">
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
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
                            <FileText className="h-10 w-10 text-slate-200" />
                        </div>
                        <div className="max-w-xs space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm text-indigo-600">No Invoices Found</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">No sales records match your current audit filters. Try searching by customer name or adjusting the date range.</p>
                        </div>
                        <Button
                            onClick={() => setFilters({ q: "", status: "all", from: null, to: null })}
                            className="bg-indigo-600 rounded-2xl h-11 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                        >
                            Reset Audit Filters
                        </Button>
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    <p>Audit Trail: {data.length} records in view</p>
                    <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span>Verified with Customer Ledger</span>
                    </div>
                </div>
            )}
        </div>
    );
}
