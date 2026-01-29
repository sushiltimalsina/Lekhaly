"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import AdvancedFilterBar from "@/components/app/advanced-filter-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { MoneyText } from "@/components/app/money";
import DateDisplay from "@/components/app/date-display";
import { getLedger } from "@/lib/api/reports";
import { listAccounts } from "@/lib/api/accounts";
import { listParties } from "@/lib/api/parties";
import { useDateFormat } from "@/lib/date-format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileDown, RefreshCw, AlertCircle, BookUser, Building2, User } from "lucide-react";
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

export default function LedgerPage() {
  const { dateFormat } = useDateFormat();

  // Initialize with This Year
  const initialRange = getDateRange("this_year");
  const [from, setFrom] = React.useState<Date | null>(initialRange.from);
  const [to, setTo] = React.useState<Date | null>(initialRange.to);
  const [accountId, setAccountId] = React.useState("");
  const [partyId, setPartyId] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [parties, setParties] = React.useState<any[]>([]);

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
    setLoading(true);
    setError(null);
    try {
      const res: any = await getLedger({
        from: from?.toISOString() || undefined,
        to: to?.toISOString() || undefined,
        accountId: accountId || undefined,
        partyId: partyId || undefined,
        q: searchQuery || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load ledger");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, accountId, partyId, searchQuery]);

  const totalDebit = rows.reduce((acc, r) => acc + (r.debit ?? 0), 0);
  const totalCredit = rows.reduce((acc, r) => acc + (r.credit ?? 0), 0);
  const closingBalance = rows.length > 0 ? (rows[rows.length - 1].balance ?? 0) : 0;
  const openingBalance = rows.length > 0 ? ((rows[0].balance ?? 0) - (rows[0].debit ?? 0) + (rows[0].credit ?? 0)) : 0;

  const columns: Column<Row>[] = [
    {
      key: "date",
      header: "Date",
      width: 150,
      cell: (r) => <DateDisplay ad={r.date} bs={r.dateBs} />,
    },
    {
      key: "ref",
      header: "Reference",
      width: 140,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="mono-numbers font-medium text-slate-700 dark:text-slate-300">{r.ref ?? "—"}</span>
        </div>
      )
    },
    {
      key: "memo",
      header: "Memo / Description",
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
      header: <span className="w-full block text-right font-bold text-foreground">Balance</span>,
      align: "right",
      width: 160,
      cell: (r) => (
        <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
          <MoneyText value={Number(r.balance ?? 0)} className="font-bold text-foreground" />
        </div>
      )
    },
  ];

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <PageHeader
          title="General Ledger"
          description="Detailed transaction history for specific accounts and parties."
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={run} disabled={loading} className="rounded-xl h-10 border-border/50">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl h-10 border-border/50">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button size="sm" className="rounded-xl h-10 shadow-lg shadow-primary/10">
            <FileDown className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Card className="border-border/50 glass-card print:hidden">
        <CardContent className="p-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
                <BookUser className="h-3 w-3" /> Select Account
              </label>
              <SearchableSelect
                options={accounts.map(a => ({ id: a.id, name: `${a.code ? a.code + ' - ' : ''}${a.name}` }))}
                valueId={accountId}
                onChange={(id) => setAccountId(id)}
                placeholder="Choose Account..."
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Select Party
              </label>
              <SearchableSelect
                options={parties.map(p => ({ id: p.id, name: p.name }))}
                valueId={partyId}
                onChange={(id) => setPartyId(id)}
                placeholder="Choose Party..."
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="lg:col-span-2">
              <AdvancedFilterBar
                className="border-none shadow-none p-0 bg-transparent"
                onSearch={setSearchQuery}
                onFilterChange={handleFilterChange}
                defaultRange="this_year"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <Card className="border-border/50 bg-slate-500/5 shadow-none overflow-hidden relative text-foreground">
          <CardContent className="pt-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Opening Balance</div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={openingBalance} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-blue-500/5 shadow-none overflow-hidden relative text-foreground">
          <CardContent className="pt-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-blue-600 dark:text-blue-400">Total Debit</div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={totalDebit} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-orange-500/5 shadow-none overflow-hidden relative text-foreground">
          <CardContent className="pt-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-orange-600 dark:text-orange-400">Total Credit</div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={totalCredit} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-primary/5 shadow-none overflow-hidden relative text-foreground ring-1 ring-primary/20">
          <CardContent className="pt-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-primary">Closing Balance</div>
            <div className="mt-2 text-xl font-bold tracking-tight">
              <MoneyText value={closingBalance} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 glass-card overflow-hidden shadow-xl shadow-foreground/5 min-h-[400px]">
        <div className="hidden print:flex flex-col items-center p-8 border-b border-border/50 text-foreground">
          <h1 className="text-2xl font-black">Lekhaly</h1>
          <h2 className="text-lg font-bold mt-1 uppercase tracking-widest">General Ledger Report</h2>
          <div className="mt-4 flex gap-12 text-sm">
            <div>
              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mr-2">Account/Party:</span>
              <span className="font-black">{(accountId && accounts.find(a => a.id === accountId)?.name) || (partyId && parties.find(p => p.id === partyId)?.name) || "Global"}</span>
            </div>
            <div>
              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mr-2">Period:</span>
              <span className="font-black">{from?.toLocaleDateString() || "Start"} - {to?.toLocaleDateString() || "End"}</span>
            </div>
          </div>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
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
    </div>
  );
}
