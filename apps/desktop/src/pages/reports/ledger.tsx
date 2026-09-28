"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import DateDisplay from "@/components/app/date-display";
import { getLedger } from "@/lib/api/reports";
import { listAccounts } from "@/lib/api/accounts";
import { listParties } from "@/lib/api/parties";
import { useDateFormat } from "@/lib/date-format";
import { getDateDisplay } from "@/lib/dates/display";
import { Card, CardContent, Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { Printer, FileDown, AlertCircle, BookOpen, Building2, Search, ArrowDownUp, TrendingUp, TrendingDown, Scale, ArrowLeft, FileText, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchableSelect from "@/components/app/searchable-select";
import { getDateRange } from "@/lib/dates/ranges";

type Row = {
  dateBs?: string;
  date?: string;
  ref?: string;
  memo?: string;
  debit?: number;
  credit?: number;
  balance?: number;
};

function LedgerBackButton({ navigate, onOpenChange }: { navigate: ReturnType<typeof useNavigate>; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/reports");
  };

  const handleRegistry = () => {
    navigate("/reports");
  };

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white pl-3.5 pr-4 text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div
        className={cn(
          "absolute left-0 top-full z-50 pt-1.5 min-w-[220px] transition-all duration-150 ease-out",
          open ? "pointer-events-auto translate-y-0 opacity-100 scale-100" : "pointer-events-none -translate-y-1 opacity-0 scale-95"
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1 shadow-2xl shadow-slate-900/10 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => { setOpen(false); handleRegistry(); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
          >
            <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>Back to Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LedgerPage() {
  const { dateFormat } = useDateFormat();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize with This Year
  const initialRange = getDateRange("this_year");
  const [from, setFrom] = React.useState<Date | null>(initialRange.from);
  const [to, setTo] = React.useState<Date | null>(initialRange.to);
  const [accountId, setAccountId] = React.useState(() => searchParams.get("accountId") ?? "");
  const [partyId, setPartyId] = React.useState(() => searchParams.get("partyId") ?? "");

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [openingBalance, setOpeningBalance] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hasFetched, setHasFetched] = React.useState(false);
  const [isBackMenuOpen, setIsBackMenuOpen] = React.useState(false);
  const [filterSettingsOpen, setFilterSettingsOpen] = React.useState(false);
  const [includeOpeningBalance, setIncludeOpeningBalance] = React.useState(true);
  const [includeClosingBalance, setIncludeClosingBalance] = React.useState(true);
  const [showOnlyNonZeroEntries, setShowOnlyNonZeroEntries] = React.useState(false);
  const [showSecondaryDateColumn, setShowSecondaryDateColumn] = React.useState(false);
  const defaultVisibleLedgerColumns = ["sno", "date", "invoiceVoucherNo", "description", "debit", "credit", "balance"];
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(defaultVisibleLedgerColumns);
  const filterSettingsRef = React.useRef<HTMLDivElement>(null);
  const filterSettingsMenuRef = React.useRef<HTMLDivElement>(null);
  const filterSettingsButtonRef = React.useRef<HTMLButtonElement>(null);
  const [settingsMenuStyle, setSettingsMenuStyle] = React.useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
    width: 320,
    maxHeight: "75vh",
    opacity: 0,
    pointerEvents: "none",
  });

  React.useEffect(() => {
    if (!filterSettingsOpen || !filterSettingsButtonRef.current) return;

    const updatePosition = () => {
      const rect = filterSettingsButtonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = 360;
      const menuHeight = Math.min(window.innerHeight * 0.74, 500);
      const left = Math.max(16, Math.min(window.innerWidth - menuWidth - 16, rect.right - menuWidth + 10));
      const top = Math.max(16, Math.min(window.innerHeight - menuHeight - 16, rect.bottom + 10));

      setSettingsMenuStyle({
        position: "fixed",
        top,
        left,
        width: menuWidth,
        height: menuHeight,
        maxHeight: menuHeight,
        zIndex: 100000,
        opacity: 1,
        pointerEvents: "auto",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [filterSettingsOpen]);

  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [parties, setParties] = React.useState<any[]>([]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedButton = filterSettingsRef.current?.contains(target);
      const clickedMenu = filterSettingsMenuRef.current?.contains(target);
      if (!clickedButton && !clickedMenu) {
        setFilterSettingsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterSettingsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const sourceLabel = accountId ? "Account" : partyId ? "Party" : "Not Selected";
  const sourceOptions = React.useMemo(() => {
    const accOptions = accounts.map((a) => ({
      id: `account-${a.id}`,
      actualId: a.id,
      type: "account" as const,
      name: `${a.code ? a.code + ' - ' : ''}${a.name}`,
    }));
    const partyOptions = parties.map((p) => ({
      id: `party-${p.id}`,
      actualId: p.id,
      type: "party" as const,
      name: p.name,
    }));
    return [...accOptions, ...partyOptions];
  }, [accounts, parties]);

  const selectedSourceValue = React.useMemo(() => {
    if (accountId) return `account-${accountId}`;
    if (partyId) return `party-${partyId}`;
    return "";
  }, [accountId, partyId]);

  const hasSelection = !!accountId || !!partyId;
  const queryAccountId = searchParams.get("accountId") ?? "";
  const queryPartyId = searchParams.get("partyId") ?? "";

  React.useEffect(() => {
    if (queryAccountId !== accountId) setAccountId(queryAccountId);
    if (queryPartyId !== partyId) setPartyId(queryPartyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryAccountId, queryPartyId]);

  React.useEffect(() => {
    async function init() {
      try {
        const [accs, pts] = await Promise.all([
          listAccounts({ take: 100 }),
          listParties({ take: 100 })
        ]);
        setAccounts(Array.isArray(accs) ? accs : []);
        setParties(Array.isArray(pts) ? pts : []);
      } catch (e) {
        console.error("Failed to load filter options", e);
      }
    }
    init();
  }, []);

  async function run() {
    if (!hasSelection) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await getLedger({
        from: from?.toISOString() || undefined,
        to: to?.toISOString() || undefined,
        accountId: accountId || undefined,
        partyId: partyId || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
      setOpeningBalance(Number(res?.openingBalance || 0));
      setHasFetched(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load ledger");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch when filters change, but only if a selection exists
  React.useEffect(() => {
    if (hasSelection) {
      run();
    } else {
      setRows([]);
      setError(null);
      setHasFetched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, accountId, partyId]);

  const filteredRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const baseRows = rows.filter((row) => {
      if (!query) return true;
      const searchable = `${row.ref ?? ""} ${row.memo ?? ""} ${(row as any)?.paymentMethod ?? ""} ${(row as any)?.additionalNotes ?? ""}`.toLowerCase();
      return searchable.includes(query);
    });

    return showOnlyNonZeroEntries
      ? baseRows.filter((row) => Number(row.debit ?? 0) !== 0 || Number(row.credit ?? 0) !== 0 || Number(row.balance ?? 0) !== 0)
      : baseRows;
  }, [rows, searchQuery, showOnlyNonZeroEntries]);

  const totalDebit = filteredRows.reduce((acc, r) => acc + (r.debit ?? 0), 0);
  const totalCredit = filteredRows.reduce((acc, r) => acc + (r.credit ?? 0), 0);
  const closingBalance = filteredRows.length > 0 ? (filteredRows[filteredRows.length - 1].balance ?? 0) : openingBalance;

  const displayRows: Row[] = React.useMemo(() => {
    const rowsToDisplay: Row[] = [...filteredRows];

    if (includeOpeningBalance) {
      rowsToDisplay.unshift({
        date: from?.toISOString(),
        memo: "Opening Balance",
        balance: openingBalance,
      });
    }

    if (includeClosingBalance) {
      rowsToDisplay.push({
        date: to?.toISOString(),
        memo: "Closing Balance",
        balance: closingBalance,
      });
    }

    return rowsToDisplay;
  }, [filteredRows, includeOpeningBalance, includeClosingBalance, from, to, openingBalance, closingBalance]);

  const selectedLabel = (accountId && accounts.find(a => a.id === accountId)?.name)
    || (partyId && parties.find(p => p.id === partyId)?.name)
    || "—";

  const secondaryDateFormat = dateFormat === "bs" ? "ad" : "bs";
  const secondaryDateLabel = secondaryDateFormat === "bs" ? "Date (BS)" : "Date (AD)";

  const ledgerColumnDefinitions: Column<Row>[] = [
    {
      key: "sno",
      header: "S/N",
      width: 80,
      cell: (_, index) => <span className="font-medium text-slate-600 dark:text-slate-300">{index + 1}</span>,
    },
    {
      key: "date",
      header: "Date",
      width: 150,
      cell: (r) => {
        if (showSecondaryDateColumn) {
          const display = getDateDisplay({ ad: r.date, bs: r.dateBs, format: dateFormat });
          return (
            <div className="min-w-0">
              <div className="mono-numbers text-slate-700 dark:text-slate-200">{display.primary}</div>
            </div>
          );
        }

        return <DateDisplay ad={r.date} bs={r.dateBs} />;
      },
    },
    {
      key: "secondaryDate",
      header: secondaryDateLabel,
      width: 150,
      cell: (r) => {
        const display = getDateDisplay({ ad: r.date, bs: r.dateBs, format: secondaryDateFormat });
        return (
          <div className="min-w-0">
            <div className="mono-numbers text-slate-700 dark:text-slate-200">{display.primary}</div>
          </div>
        );
      },
    },
    {
      key: "invoiceVoucherNo",
      header: "Invoice / Voucher Number",
      width: 180,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary/40" />
          <span className="mono-numbers font-medium text-slate-700 dark:text-slate-300">{r.ref ?? "—"}</span>
        </div>
      )
    },
    {
      key: "referenceNo",
      header: "Reference Number",
      width: 180,
      cell: (r) => (
        <span className="mono-numbers font-medium text-slate-700 dark:text-slate-300">{r.ref ?? "—"}</span>
      )
    },
    {
      key: "shortNarration",
      header: "Short Narration",
      width: 220,
      cell: (r) => <div className="text-sm text-slate-600 dark:text-slate-400 max-w-md truncate">{r.memo ?? "—"}</div>
    },
    {
      key: "description",
      header: "Description",
      width: 220,
      cell: (r) => <div className="text-sm text-slate-600 dark:text-slate-400 max-w-md truncate">{r.memo ?? "—"}</div>
    },
    {
      key: "debit",
      header: <span className="w-full block text-right">Debit</span>,
      align: "right",
      width: 140,
      cell: (r) => <MoneyText value={Number(r.debit ?? 0)} className={cn(r.debit === 0 && "text-muted-foreground/30")} />
    },
    {
      key: "credit",
      header: <span className="w-full block text-right">Credit</span>,
      align: "right",
      width: 140,
      cell: (r) => <MoneyText value={Number(r.credit ?? 0)} className={cn(r.credit === 0 && "text-muted-foreground/30")} />
    },
    {
      key: "balance",
      header: <span className="w-full block text-right font-normal text-foreground">Balance</span>,
      align: "right",
      width: 160,
      cell: (r) => (
        <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
          <MoneyText value={Number(r.balance ?? 0)} className="font-normal text-foreground" />
        </div>
      )
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      width: 160,
      cell: (r) => <span className="text-sm text-slate-600 dark:text-slate-400">{(r as any).paymentMethod ?? (r as any).paymentMethodName ?? "—"}</span>
    },
    {
      key: "additionalNotes",
      header: "Additional Notes",
      width: 180,
      cell: (r) => <span className="text-sm text-slate-600 dark:text-slate-400">{(r as any).additionalNotes ?? (r as any).additionalNote ?? "—"}</span>
    },
  ];

  const visibleLedgerColumns = React.useMemo(
    () => ledgerColumnDefinitions.filter((column) => {
      if (column.key === "secondaryDate") return showSecondaryDateColumn;
      return visibleColumns.includes(column.key);
    }),
    [ledgerColumnDefinitions, showSecondaryDateColumn, visibleColumns]
  );

  const ledgerOptionFields = [
    { key: "includeClosingBalance", label: "Include Closing Balance", checked: includeClosingBalance, onChange: setIncludeClosingBalance },
    { key: "includeOpeningBalance", label: "Include Opening Balance", checked: includeOpeningBalance, onChange: setIncludeOpeningBalance },
    { key: "showOnlyNonZeroEntries", label: "Show Only Non-Zero Entries", checked: showOnlyNonZeroEntries, onChange: setShowOnlyNonZeroEntries },
  ] as const;

  const applyFilterSettings = () => {
    setFilterSettingsOpen(false);
  };

  const resetFilterSettings = () => {
    setIncludeOpeningBalance(true);
    setIncludeClosingBalance(true);
    setShowOnlyNonZeroEntries(false);
    setShowSecondaryDateColumn(false);
    setVisibleColumns([...defaultVisibleLedgerColumns]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFilterChange = (filters: any) => {
    if (filters.dateRange) {
      setFrom(filters.dateRange.from || null);
      setTo(filters.dateRange.to || null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-5">
            <LedgerBackButton navigate={navigate} onOpenChange={setIsBackMenuOpen} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className={cn("flex items-center gap-4 transition-all duration-200", isBackMenuOpen && "pt-6")}>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 transition-all duration-200", isBackMenuOpen && "translate-y-4")}>
                <BookOpen className="h-6 w-6" />
              </div>
              <div className={cn("transition-all duration-200", isBackMenuOpen && "translate-y-4")}>
                <h1 className="text-2xl font-bold italic tracking-tight text-slate-900 dark:text-slate-100">
                  General Ledger
                </h1>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Review account and party transactions for the selected time period.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={rows.length === 0} className="rounded-xl h-10 border-blue-200 bg-white text-blue-700 hover:border-blue-500 hover:text-blue-700 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button size="sm" disabled={rows.length === 0} className="rounded-xl h-10 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-blue-200/80 bg-white/80 shadow-sm backdrop-blur-sm print:hidden dark:border-blue-900/60 dark:bg-slate-900/70">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="w-full min-w-[260px] flex-1 xl:max-w-[calc(100%-500px)]">
              <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Building2 className="h-3 w-3" />
                Account / Party
              </label>
              <SearchableSelect
                options={sourceOptions}
                valueId={selectedSourceValue}
                onChange={(id) => {
                  const selected = sourceOptions.find((option) => option.id === id);
                  if (!selected) return;

                  if (selected.type === "account") {
                    setAccountId(selected.actualId);
                    setPartyId("");
                  } else {
                    setPartyId(selected.actualId);
                    setAccountId("");
                  }
                }}
                placeholder="Choose Account or Party..."
                className="w-full rounded-xl border-blue-200 shadow-sm"
              />
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                Source: {sourceLabel}
              </div>
            </div>

            <div className="flex w-full flex-1 flex-wrap items-center justify-end gap-3">
              <div className="order-2 relative w-full min-w-[220px] max-w-sm xl:max-w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reference or narration"
                  className="h-10 border-blue-200 bg-white pl-9 text-sm shadow-sm focus-visible:ring-blue-500 dark:border-blue-800 dark:bg-slate-900"
                />
              </div>

              <div className="order-1 min-w-[260px] flex-1 xl:ml-auto">
                <div className="flex items-center justify-end gap-2">
                  <AdvancedFilterBar
                    className="border-none shadow-none p-0 bg-transparent"
                    config={{
                      search: { enabled: false },
                      dateRange: { enabled: true, defaultRange: "this_year", allowCustom: true },
                      columns: [],
                      theme: { accentColor: "blue", density: "comfortable", variant: "flat" },
                    }}
                    onFilterChange={handleFilterChange}
                    defaultRange="this_year"
                  />

                  <div ref={filterSettingsRef} className="relative">
                    <Button
                      ref={filterSettingsButtonRef}
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterSettingsOpen((open) => !open)}
                      className="h-9 rounded-xl border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:border-blue-500 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <Settings2 className="mr-2 h-3.5 w-3.5 text-blue-600" />
                      Filter Settings
                    </Button>

                    {filterSettingsOpen
                      ? createPortal(
                          <div ref={filterSettingsMenuRef} style={settingsMenuStyle} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900">
                            <div className="flex-shrink-0 border-b border-slate-100 p-3 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Filter Settings</span>
                                <button
                                  type="button"
                                  onClick={() => setFilterSettingsOpen(false)}
                                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                  aria-label="Close filter settings"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-3.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                              <div className="space-y-4">
                                <div>
                                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ledger Options</div>
                                  <div className="space-y-2.5">
                                    {ledgerOptionFields.map((option) => (
                                      <label key={option.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                        <input
                                          type="checkbox"
                                          checked={option.checked}
                                          onChange={(event) => option.onChange(event.target.checked)}
                                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{option.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Columns</div>
                                  <div className="bg-slate-50/70 p-2.5 dark:bg-slate-800/50">
                                    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-200">
                                      <div className="flex-1">
                                        <div className="font-medium">Show secondary date</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                          {dateFormat === "bs" ? "Displays AD date in a separate column" : "Displays BS date in a separate column"}
                                        </div>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={showSecondaryDateColumn}
                                        onChange={(event) => setShowSecondaryDateColumn(event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                    </label>
                                  </div>
                                  <div className="mt-3 space-y-2">
                                    {ledgerColumnDefinitions.map((column) => {
                                      if (column.key === "secondaryDate") return null;
                                      const checked = column.key === "description" || visibleColumns.includes(column.key);
                                      const isRequired = column.key === "description";
                                      return (
                                        <label
                                          key={column.key}
                                          className={cn(
                                            "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80",
                                            isRequired && "cursor-default"
                                          )}
                                          onClick={(event) => {
                                            if (isRequired) {
                                              event.preventDefault();
                                              event.stopPropagation();
                                            }
                                          }}
                                        >
                                          <span className="text-sm font-normal text-slate-700 dark:text-slate-200">{column.header}</span>
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            readOnly={isRequired}
                                            onChange={() => {
                                              if (isRequired) return;
                                              setVisibleColumns((current) => current.includes(column.key)
                                                ? current.filter((key) => key !== column.key)
                                                : [...current, column.key]);
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-80"
                                          />
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0 border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                              <div className="space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    resetFilterSettings();
                                  }}
                                  className="h-8 w-full rounded-xl border-slate-200 bg-white text-xs font-bold text-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/40"
                                >
                                  Reset to Default
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={applyFilterSettings}
                                  className="h-8 w-full rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                                >
                                  Apply
                                </Button>
                              </div>
                            </div>
                          </div>,
                          document.body
                        )
                      : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error banner */}
      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Failed to load ledger</div>
            <div className="text-destructive/70 text-xs mt-0.5">{error}</div>
          </div>
        </div>
      ) : null}

      {/* Empty state â€” no selection */}
      {!hasSelection && !error ? (
        <Card className="border-border/50 border-dashed bg-muted/20 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-2xl bg-primary/10 p-4 mb-5">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Select an Account or Party</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Choose an account or party from the filters above to view their detailed transaction ledger with running balances.
            </p>
            <div className="flex items-center gap-6 mt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Account Ledger</span>
              </div>
              <div className="text-border">|</div>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span>Party Ledger</span>
              </div>
              <div className="text-border">|</div>
              <div className="flex items-center gap-1.5">
                <ArrowDownUp className="h-3.5 w-3.5" />
                <span>Running Balance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats cards â€” only show when we have data */}
      {hasSelection && hasFetched ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
            <Card className="border-border/50 bg-slate-500/5 shadow-none overflow-hidden relative text-foreground group hover:bg-slate-500/8 transition-colors">
              <div className="absolute right-0 top-0 h-16 w-16 bg-slate-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <CardContent className="pt-6">
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Scale className="h-3 w-3" /> Opening Balance
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">
                  <MoneyText value={openingBalance} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-blue-500/5 shadow-none overflow-hidden relative text-foreground group hover:bg-blue-500/8 transition-colors">
              <div className="absolute right-0 top-0 h-16 w-16 bg-blue-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <CardContent className="pt-6">
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> Total Debit
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">
                  <MoneyText value={totalDebit} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-orange-500/5 shadow-none overflow-hidden relative text-foreground group hover:bg-orange-500/8 transition-colors">
              <div className="absolute right-0 top-0 h-16 w-16 bg-orange-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <CardContent className="pt-6">
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                  <TrendingDown className="h-3 w-3" /> Total Credit
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">
                  <MoneyText value={totalCredit} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-primary/5 shadow-none overflow-hidden relative text-foreground ring-1 ring-primary/20 group hover:bg-primary/8 transition-colors">
              <div className="absolute right-0 top-0 h-16 w-16 bg-primary/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <CardContent className="pt-6">
                <div className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1.5">
                  <Scale className="h-3 w-3" /> Closing Balance
                </div>
                <div className="mt-2 text-xl font-bold tracking-tight">
                  <MoneyText value={closingBalance} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card className="border-border/50 glass-card overflow-hidden shadow-xl shadow-foreground/5 min-h-[400px]">
            {/* Print header */}
            <div className="hidden print:flex flex-col items-center p-8 border-b border-border/50 text-foreground">
              <h1 className="text-2xl font-black">Lekhaly</h1>
              <h2 className="text-lg font-bold mt-1 uppercase tracking-widest">General Ledger Report</h2>
              <div className="mt-4 flex gap-12 text-sm">
                <div>
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mr-2">Account/Party:</span>
                  <span className="font-black">{selectedLabel}</span>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mr-2">Period:</span>
                  <span className="font-black">{from?.toLocaleDateString() || "Start"} - {to?.toLocaleDateString() || "End"}</span>
                </div>
              </div>
            </div>
            <DataTable
              rows={displayRows}
              columns={visibleLedgerColumns}
              loading={loading}
              emptyText="No ledger entries found for the selected filters"
              className="border-none"
            />
            {rows.length > 0 && (
              <div className="flex items-center justify-end gap-x-12 border-t border-border/50 bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Periodic</div>
                    <div className="flex gap-8">
                      <MoneyText value={totalDebit} className="text-sm font-bold text-foreground" />
                      <MoneyText value={totalCredit} className="text-sm font-bold text-foreground" />
                    </div>
                  </div>
                  <div className="text-right border-l border-border/50 pl-8">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Final Balance</div>
                    <MoneyText value={closingBalance} className="text-lg font-black text-foreground" />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

