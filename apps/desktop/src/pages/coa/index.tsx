import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Plus, Search, MoreHorizontal, Layers, FolderPlus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAccountSummary, AccountRecord } from "@/lib/api/accounts";
import AddAccountGroupDialog from "@/components/app/add-account-group-dialog";
import { MoneyText } from "@/components/app/money";
import { ChevronDown } from "lucide-react";

export default function CoaPage() {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);

  async function loadAccounts() {
    setLoading(true);
    setError(null);
    try {
      const res = await getAccountSummary();
      setAccounts(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load Chart of Accounts");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadAccounts();
  }, []);

  const filtered = accounts.filter((r) => {
    if (!q.trim()) return true;
    return `${r.code} ${r.name} ${r.type}`.toLowerCase().includes(q.toLowerCase());
  });

  const stats = React.useMemo(() => {
    const s = { asset: 0, liability: 0, equity: 0, income: 0, expense: 0 };
    accounts.forEach(acc => {
      if (s[acc.type as keyof typeof s] !== undefined) {
        s[acc.type as keyof typeof s]++;
      }
    });
    return s;
  }, [accounts]);

  const columns: Column<AccountRecord>[] = [
    {
      key: "code",
      header: "Account Code",
      cell: (r) => (
        <span className="mono-numbers font-bold text-slate-500 dark:text-slate-400 tabular-nums">
          {r.code || "—"}
        </span>
      ),
      width: 140
    },
    {
      key: "name",
      header: "Account Name",
      cell: (r) => (
        <div className="flex items-center py-1" style={{ paddingLeft: `${(r.level || 0) * 24}px` }}>
          <div className="flex items-center gap-3">
            {r.isGroup ? (
              <div className="flex h-5 w-5 items-center justify-center text-muted-foreground/40">
                <ChevronDown className="h-4 w-4" />
              </div>
            ) : (
              <div className="h-5 w-5" />
            )}
            <div className={cn(
              "h-2.5 w-2.5 rounded-full ring-4 shadow-sm",
              r.type === 'asset' ? "bg-blue-500 ring-blue-500/10" :
                r.type === 'liability' ? "bg-orange-500 ring-orange-500/10" :
                  r.type === 'income' ? "bg-emerald-500 ring-emerald-500/10" :
                    r.type === 'expense' ? "bg-red-500 ring-red-500/10" : "bg-indigo-500 ring-indigo-500/10"
            )} />
            <div>
              <div className={cn(
                "font-bold text-foreground", 
                r.isGroup ? "text-[15px] tracking-tight text-slate-900 dark:text-slate-100" : "text-sm text-slate-600 dark:text-slate-400"
              )}>
                {r.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {r.isGroup && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-500 tracking-widest border border-slate-200 dark:border-slate-700">Group</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      width: 180,
      cell: (r) => (
        <div className={cn(
          "font-mono font-bold tracking-tight",
          r.isGroup ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
        )}>
          <MoneyText value={Number(r.total_balance || 0)} />
        </div>
      )
    },
    {
      key: "type",
      header: "Financial Type",
      cell: (r) => (
        <span className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm",
          r.type === 'asset' ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50" :
            r.type === 'liability' ? "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50" :
              r.type === 'income' ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50" :
                r.type === 'expense' ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50" :
                  "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50"
        )}>
          {r.type}
        </span>
      ),
      width: 160,
    },
    {
      key: "postable",
      header: "Posting",
      width: 120,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className={cn("h-1.5 w-1.5 rounded-full", r.isPostable ? "bg-emerald-500" : "bg-slate-300")} />
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.isPostable ? "Enabled" : "Meta Only"}</span>
        </div>
      )
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 60,
      cell: () => (
        <div className="flex justify-end pr-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted group">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader
          title="Chart of Accounts"
          description="Organize your financial structure with hierarchical account groups and postable ledgers."
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadAccounts} disabled={loading} className="rounded-2xl h-12 px-6 border-border/60 glass-panel bg-white/50 dark:bg-black/5 hover:bg-primary/5 transition-all font-bold">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Reload
          </Button>
          <Button
            onClick={() => setAddGroupOpen(true)}
            variant="outline"
            className="rounded-2xl h-12 px-6 border-indigo-600/30 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold"
          >
            <FolderPlus className="mr-2 h-5 w-5" />
            Add Group
          </Button>
          <Button className="shadow-2xl shadow-primary/30 rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 font-bold tracking-tight">
            <Plus className="mr-2 h-5 w-5 stroke-[3px]" />
            New Account
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Assets" count={stats.asset} type="asset" icon={Layers} />
        <StatCard title="Liabilities" count={stats.liability} type="liability" icon={Layers} />
        <StatCard title="Equity" count={stats.equity} type="equity" icon={Layers} />
        <StatCard title="Income" count={stats.income} type="income" icon={Layers} />
        <StatCard title="Expenses" count={stats.expense} type="expense" icon={Layers} />
      </div>

      <div className="flex flex-col gap-0 rounded-[2.5rem] border border-border/50 bg-card overflow-hidden shadow-2xl shadow-foreground/[0.02]">
        <div className="p-6 md:p-8 bg-muted/20 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40">
          <div className="relative w-full sm:w-[400px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search accounts or codes..."
              className="pl-12 h-14 rounded-2xl bg-white dark:bg-muted/10 border-border/50 focus-visible:ring-primary/20 text-base font-medium"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" className="h-14 rounded-2xl px-6 border-border/50 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold">Import CSV</Button>
            <Button variant="outline" className="h-14 rounded-2xl px-6 border-border/50 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold">Export PDF</Button>
          </div>
        </div>
        <div className="px-2">
          <DataTable
            rows={filtered}
            columns={columns}
            loading={loading}
            emptyText="No accounts found. Start by creating a root group."
            className="border-none shadow-none bg-transparent"
            rowClassName="hover:bg-primary/[0.02] cursor-pointer group/row transition-all duration-300"
          />
        </div>
      </div>

      <AddAccountGroupDialog
        open={addGroupOpen}
        onClose={() => setAddGroupOpen(false)}
        onSuccess={loadAccounts}
        parentOptions={accounts.filter(a => !a.isPostable).map(a => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}

function StatCard({ title, count, type, icon: Icon }: { title: string, count: number, type: string, icon: any }) {
  const colors: any = {
    asset: "border-l-blue-500 bg-blue-500/5 text-blue-600 ring-blue-500/10",
    liability: "border-l-orange-500 bg-orange-500/5 text-orange-600 ring-orange-500/10",
    equity: "border-l-indigo-500 bg-indigo-500/5 text-indigo-600 ring-indigo-500/10",
    income: "border-l-emerald-500 bg-emerald-500/5 text-emerald-600 ring-emerald-500/10",
    expense: "border-l-red-500 bg-red-500/5 text-red-600 ring-red-500/10"
  };

  return (
    <div className={cn("rounded-3xl border bg-card p-6 shadow-xl shadow-foreground/[0.02] border-l-4 transition-all hover:scale-105", colors[type])}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</div>
        <Icon className="h-4 w-4 opacity-20" />
      </div>
      <div className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{count}</div>
      <div className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total Ledgers</div>
    </div>
  );
}
