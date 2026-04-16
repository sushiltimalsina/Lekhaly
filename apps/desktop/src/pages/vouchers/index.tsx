// apps/desktop/src/pages/vouchers/index.tsx
import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronRight,
  FileText,
  ArrowRightLeft,
  Wallet,
  ShoppingCart,
  History,
  Info
} from "lucide-react";
import PageHeader from "@/components/app/page-header";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import { MoneyText } from "@/components/app/money";
import { listVouchers, VoucherType } from "@/lib/api/vouchers";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { cn } from "@/lib/utils";
import { Button } from "@lekhaly/ui";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";

const VOUCHER_TYPE_METADATA: Record<string, { label: string; icon: any; color: string }> = {
  sales_invoice: { label: "Sales Invoice", icon: FileText, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  sales_return: { label: "Sales Return", icon: History, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
  purchase: { label: "Purchase", icon: ShoppingCart, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
  purchase_return: { label: "Purchase Return", icon: History, color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20" },
  receipt: { label: "Receipt", icon: Wallet, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  payment: { label: "Payment", icon: Wallet, color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20" },
  journal: { label: "Journal", icon: ArrowRightLeft, color: "text-slate-600 bg-slate-50 dark:bg-slate-900/20" },
  opening: { label: "Opening", icon: Info, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
  reversal: { label: "Reversal", icon: History, color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
};

export default function VouchersListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dateFormat } = useDateFormat();

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

  /* Pagination State */
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);
  const [totalRecords, setTotalRecords] = React.useState(0);

  /* Density State */
  const [compactMode, setCompactMode] = React.useState(false);

  /* Summary Metrics */
  const metrics = React.useMemo(() => {
    const totalDebit = vouchers.reduce((acc, v) => acc + (v.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0), 0);
    const draftCount = vouchers.filter(v => v.status === "draft").length;
    return { totalDebit, draftCount };
  }, [vouchers]);

  async function load() {
    setLoading(true);
    try {
      const res = await listVouchers({
        q: filters.q || undefined,
        type: filters.type === "all" ? undefined : (filters.type as VoucherType),
        status: filters.status === "all" ? undefined : (filters.status as any),
        from: filters.from || undefined,
        to: filters.to || undefined,
        take: pageSize,
        skip: (page - 1) * pageSize,
      });
      
      if (res && res.data && res.meta) {
        setVouchers(res.data);
        setTotalRecords(res.meta.total);
        setTotalPages(res.meta.lastPage);
      } else {
        const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        setVouchers(list);
        setTotalRecords(list.length);
        setTotalPages(1);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load vouchers");
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
      key: "type",
      label: "Category",
      multiple: false,
      options: [
        { value: "all", label: "All Types" },
        ...Object.entries(VOUCHER_TYPE_METADATA).map(([val, meta]) => ({ value: val, label: meta.label }))
      ]
    },
    {
      key: "status",
      label: "Status",
      multiple: false,
      options: [
        { value: "draft", label: "Draft" },
        { value: "posted", label: "Posted" },
        { value: "void", label: "Void" },
      ]
    }
  ];

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      type: newFilters.type && newFilters.type.length > 0 ? newFilters.type[0] : "all",
      status: newFilters.status && newFilters.status.length > 0 ? newFilters.status[0] : "all",
      from: newFilters.dateRange?.from || null,
      to: newFilters.dateRange?.to || null,
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Vouchers"
          description="View and manage all financial transactions and vouchers."
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
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Total Records:</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg shadow-sm">{totalRecords}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Volume (View)</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1"><MoneyText value={metrics.totalDebit} /></span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pending Drafts</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1">{metrics.draftCount}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
            <FileText className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-200">System Status</span>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sm">Ledger Synced</span>
          </div>
        </div>
      </div>

      <AdvancedFilterBar
        onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
        searchValue={filters.q}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
      />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none flex flex-col">
        {loading && vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-slate-500 animate-pulse uppercase tracking-widest text-[10px]">Loading Ledger...</p>
          </div>
        ) : vouchers.length > 0 ? (
          <>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Date Identity</th>
                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Voucher Reference</th>
                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Category</th>
                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px]", compactMode ? "py-3" : "py-4")}>Party Context</th>
                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right", compactMode ? "py-3" : "py-4")}>Amount</th>
                    <th className={cn("px-6 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center", compactMode ? "py-3" : "py-4")}>Status</th>
                    <th className={cn("px-6 w-10", compactMode ? "py-3" : "py-4")}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {vouchers.map((v) => {
                    const meta = VOUCHER_TYPE_METADATA[v.voucherType] || { label: v.voucherType, icon: FileText, color: "text-slate-600 bg-slate-50" };
                    const dateInfo = getDateDisplay({ ad: v.voucherDate, bs: v.voucherDateBs, format: dateFormat });
                    const Icon = meta.icon;

                    const totalDebit = v.lines?.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0) || 0;
                    const totalCredit = v.lines?.reduce((sum: number, line: any) => sum + Number(line.credit || 0), 0) || 0;

                    const py = compactMode ? "py-2.5" : "py-5";

                    return (
                      <tr
                        key={v.id}
                        onClick={() => navigate(`/vouchers/view?id=${v.id}`)}
                        className="group cursor-pointer hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"
                      >
                        <td className={`px-6 ${py} whitespace-nowrap`}>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{dateInfo.primary}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{dateInfo.secondary}</span>
                          </div>
                        </td>
                        <td className={`px-6 ${py} whitespace-nowrap`}>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {v.voucherNumber || v.voucherNo || "DRAFT-" + v.id.slice(0, 4)}
                            </span>
                            {v.referenceNo && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {v.referenceNo}</span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 ${py} whitespace-nowrap`}>
                          <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm", meta.color)}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </div>
                        </td>
                        <td className={`px-6 ${py}`}>
                          <div className="flex flex-col max-w-[200px]">
                            <span className="truncate font-bold text-slate-700 dark:text-slate-200">
                              {v.party?.name || v.partyName || "General Entry"}
                            </span>
                            <span className="truncate text-[11px] text-slate-400 italic font-medium">
                              {v.memo || "No memo linked"}
                            </span>
                          </div>
                        </td>
                        <td className={`px-6 ${py} whitespace-nowrap text-right`}>
                          <div className="flex flex-col items-end">
                            <span className="font-black text-slate-900 dark:text-white tabular-nums text-sm">
                              <MoneyText value={totalDebit} />
                            </span>
                            {totalDebit !== totalCredit && (
                              <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded flex items-center gap-1 mt-0.5">
                                Unbalanced
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 ${py} whitespace-nowrap text-center`}>
                          <StatusBadge status={v.status as DocStatus} />
                        </td>
                        <td className={`px-6 ${py} text-right`}>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1 outline-none focus:ring-2 ring-indigo-500/50"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Page {page} of {totalPages}
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <div className="max-w-[280px] space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm text-indigo-600">No Vouchers Found</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">No transactions match your current filter parameters. Try expanding your date range or clearing category filters.</p>
            </div>
            <Button
              onClick={() => setFilters({ q: "", type: "all", status: "all", from: null, to: null })}
              variant="outline"
              className="rounded-2xl h-10 px-6 font-black text-[10px] uppercase tracking-widest border-2"
            >
              Reset Audit Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
