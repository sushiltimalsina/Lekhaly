// apps/desktop/src/pages/vouchers/index.tsx
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  ArrowRightLeft,
  Wallet,
  History,
  Info,
  Plus,
  ChevronRight,
  Filter,
  Download
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listVouchers, type VoucherType } from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import { getSettings, subscribeSettings } from "@/lib/store/settings";

const VOUCHER_TYPE_METADATA: Record<string, { label: string; icon: any; color: string }> = {
  sales_invoice: { label: "Sales Invoice", icon: FileText, color: "text-blue-600 bg-blue-50" },
  sales_return: { label: "Sales Return", icon: History, color: "text-indigo-600 bg-indigo-50" },
  purchase: { label: "Purchase", icon: ShoppingCart, color: "text-orange-600 bg-orange-50" },
  purchase_return: { label: "Purchase Return", icon: History, color: "text-rose-600 bg-rose-50" },
  receipt: { label: "Receipt", icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
  payment: { label: "Payment", icon: Wallet, color: "text-rose-600 bg-rose-50" },
  journal: { label: "Journal", icon: ArrowRightLeft, color: "text-slate-600 bg-slate-50" },
  opening: { label: "Opening", icon: Info, color: "text-violet-600 bg-violet-50" },
  reversal: { label: "Reversal", icon: History, color: "text-red-600 bg-red-50" },
};

// Simple ShoppingCart icon placeholder since I don't want to import it twice if not needed
function ShoppingCart(props: any) { return <ShoppingCartIcon {...props} /> }
import { ShoppingCart as ShoppingCartIcon } from "lucide-react";

export default function VouchersListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dateFormat } = useDateFormat();
  const [settings, setSettings] = React.useState(getSettings());

  const [loading, setLoading] = React.useState(true);
  const [vouchers, setVouchers] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState({
    q: searchParams.get("q") || "",
    type: searchParams.get("type") || "all",
    status: searchParams.get("status") || "all",
    from: null as Date | null,
    to: null as Date | null,
  });

  const calendarFmt = settings.calendarPreference.toLowerCase() as "ad" | "bs";

  React.useEffect(() => {
    const unsubscribe = subscribeSettings((next) => setSettings(next));
    return () => unsubscribe();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listVouchers({
        q: filters.q || undefined,
        type: filters.type === "all" ? undefined : (filters.type as VoucherType),
        status: filters.status === "all" ? undefined : (filters.status as any),
        from: filters.from || undefined,
        to: filters.to || undefined,
        take: 100
      });
      const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
      setVouchers(list);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const filterOptions = [
    {
      key: "type",
      label: "Category",
      options: [
        { value: "all", label: "All Types" },
        ...Object.entries(VOUCHER_TYPE_METADATA).map(([val, meta]) => ({ value: val, label: meta.label }))
      ]
    },
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
      { key: "ref", label: "Reference / Number", defaultVisible: true },
      { key: "type", label: "Category", defaultVisible: true },
      { key: "party", label: "Related Entity", defaultVisible: true },
      { key: "amount", label: "Total Value", defaultVisible: true },
      { key: "status", label: "Status", defaultVisible: true },
  ];

  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(
      columnOptions.filter(o => o.defaultVisible).map(o => o.key)
  );

  const isVisible = (key: string) => visibleColumns.includes(key);

  const handleFilterChange = (f: any) => {
    setFilters(prev => ({
      ...prev,
      type: f.type?.[0] || "all",
      status: f.status?.[0] || "all",
      from: f.dateRange?.from || null,
      to: f.dateRange?.to || null,
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Financial Registry"
        description="Core audit trail for all vouchers, journals, receipts, and payments."
        actions={
            <div className="flex gap-2">
                <Button variant="outline" className="h-10 px-4 rounded-xl hidden sm:flex">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button onClick={() => navigate("/receipts/create")} className="h-10 px-6 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                    <Plus className="mr-2 h-4 w-4" /> New Voucher
                </Button>
            </div>
        }
      />

      <AdvancedFilterBar
        onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        columnOptions={columnOptions}
        onVisibleColumnsChange={setVisibleColumns}
      />

      <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading && vouchers.length === 0 ? (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Auditing Central Ledger...</p>
          </div>
        ) : vouchers.length > 0 ? (
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    {isVisible("date") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Audit Date</th>}
                    {isVisible("ref") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Voucher Reference</th>}
                    {isVisible("type") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Category</th>}
                    {isVisible("party") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Entity Context</th>}
                    {isVisible("amount") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Debit Balance</th>}
                    {isVisible("status") && <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Audit Status</th>}
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vouchers.map((v) => {
                    const meta = VOUCHER_TYPE_METADATA[v.voucherType] || { label: v.voucherType, icon: FileText, color: "text-slate-600 bg-slate-50" };
                    const dateInfo = getDateDisplay({ ad: v.voucherDate, bs: v.voucherDateBs, format: calendarFmt });
                    const Icon = meta.icon;
                    const totalDebit = v.lines?.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0) || 0;

                    return (
                      <tr
                        key={v.id}
                        onClick={() => navigate(`/vouchers/view/${v.id}`)}
                        className="group cursor-pointer hover:bg-indigo-50/20 transition-colors"
                      >
                        {isVisible("date") && (
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{dateInfo.primary}</span>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{dateInfo.secondary}</span>
                              </div>
                            </td>
                        )}
                        {isVisible("ref") && (
                            <td className="px-6 py-5 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="font-black text-slate-900 uppercase tracking-tight text-[11px] group-hover:text-indigo-600">{v.voucherNumber || v.voucherNo || "DRAFT"}</span>
                                    {v.referenceNo && <span className="text-[9px] font-bold text-slate-400">REF: {v.referenceNo}</span>}
                                </div>
                            </td>
                        )}
                        {isVisible("type") && (
                            <td className="px-6 py-5">
                                <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm", meta.color)}>
                                    <Icon className="h-3 w-3" />
                                    {meta.label}
                                </div>
                            </td>
                        )}
                        {isVisible("party") && (
                            <td className="px-6 py-5 truncate max-w-[200px]">
                                <span className="font-bold text-slate-700">{v.party?.name || v.partyName || "Internal Sequence"}</span>
                            </td>
                        )}
                        {isVisible("amount") && (
                            <td className="px-6 py-5 text-right font-black text-slate-900 tabular-nums">
                                <MoneyText value={totalDebit} />
                            </td>
                        )}
                        {isVisible("status") && (
                            <td className="px-6 py-5 text-center">
                                <StatusBadge status={v.status as DocStatus} />
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
          <div className="py-24 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
              <FileText className="h-6 w-6 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No audit vouchers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
