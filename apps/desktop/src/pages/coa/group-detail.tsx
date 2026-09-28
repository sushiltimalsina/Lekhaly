import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import DataTable, { Column } from "@/components/app/data-table";
import { Button } from "@lekhaly/ui";
import { ArrowLeft, ChevronRight, FolderTree } from "lucide-react";
import { MoneyText } from "@/components/app/money";
import { getAccountSummary, type AccountRecord, type AccountType } from "@/lib/api/accounts";
import { cn } from "@/lib/utils";

type GroupRow = AccountRecord & { relativeLevel: number };

function CoaBackButton({
  onChart,
  onParent,
  parentGroupName,
}: {
  onChart: () => void;
  onParent?: () => void;
  parentGroupName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      className="relative -mt-3.5 mb-7 inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={onChart}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white pl-3.5 pr-4 text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
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
            onClick={() => { setOpen(false); onChart(); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
          >
            <FolderTree className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>Back to Chart of Accounts</span>
          </button>
          {onParent && parentGroupName && (
            <button
              type="button"
              onClick={() => { setOpen(false); onParent(); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
            >
              <ChevronRight className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span>Back to {parentGroupName}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoaGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    getAccountSummary()
      .then(result => {
        if (active) setAccounts(Array.isArray(result) ? result : []);
      })
      .catch(err => {
        if (active) setError(err?.message || "Failed to load account group");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const group = accounts.find(account => account.id === id && account.isGroup);
  const parentGroup = group ? accounts.find(account => account.id === group.parentId && account.isGroup) : null;
  const descendants = group ? getDescendants(accounts, group.id) : [];
  const columns: Column<GroupRow>[] = [
    {
      key: "code",
      header: "Account Code",
      width: 150,
      cell: account => <span className="font-mono font-semibold tabular-nums text-muted-foreground">{account.code}</span>,
    },
    {
      key: "name",
      header: "Account",
      cell: account => (
        <button
          type="button"
          onClick={() => navigate(account.isGroup ? `/coa/${encodeURIComponent(account.id)}` : `/reports/ledger?accountId=${encodeURIComponent(account.id)}`)}
          className="flex max-w-full items-center gap-2 text-left hover:text-primary"
        >
          {account.isGroup && <ChevronRight className="h-4 w-4 shrink-0 text-indigo-500" />}
          <span className={cn("truncate", account.isGroup ? "font-semibold text-foreground" : "font-medium text-muted-foreground")} style={{ paddingLeft: `${account.relativeLevel * 18}px` }}>
            {account.name}
          </span>
          <span className="shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {account.isGroup ? "Group" : "Ledger"}
          </span>
          {account.isContra && <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">{account.type === "income" ? "Contra-Income" : "Contra-Expense"}</span>}
        </button>
      ),
    },
    {
      key: "type",
      header: "Financial Type",
      width: 150,
      cell: account => <span className="text-sm text-muted-foreground">{typeLabel(account.type)}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      width: 180,
      align: "right",
      cell: account => <MoneyText value={Number(account.total_balance || 0)} className={account.isGroup ? "font-semibold text-foreground" : "text-muted-foreground"} />,
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-3">
          <CoaBackButton
            onChart={() => navigate("/coa")}
            onParent={parentGroup ? () => navigate(`/coa/${encodeURIComponent(parentGroup.id)}`) : undefined}
            parentGroupName={parentGroup?.name}
          />
          <PageHeader
            title={group?.name ?? "Account Group"}
            description={group ? `${group.code} · ${typeLabel(group.type)} group breakdown` : "Accounts and balances within this group."}
          />
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!loading && !error && !group && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">This account group is unavailable.</div>
      )}

      {group && (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><FolderTree className="h-4 w-4" />Accounts in group</div>
              <div className="mt-2 text-2xl font-bold tabular-nums">{descendants.length}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Current group balance</div>
              <div className="mt-2"><MoneyText value={Number(group.total_balance || 0)} className="text-2xl font-bold text-foreground" /></div>
            </div>
          </section>
          <DataTable rows={descendants} columns={columns} loading={loading} emptyText="This group has no child accounts." className="bg-card" />
        </>
      )}
    </div>
  );
}

function getDescendants(accounts: AccountRecord[], parentId: string): GroupRow[] {
  const children = new Map<string | null, AccountRecord[]>();
  accounts.forEach(account => {
    const siblings = children.get(account.parentId ?? null) ?? [];
    siblings.push(account);
    children.set(account.parentId ?? null, siblings);
  });
  children.forEach(siblings => siblings.sort((a, b) => Number(b.isGroup) - Number(a.isGroup) || a.code.localeCompare(b.code, undefined, { numeric: true })));

  const rows: GroupRow[] = [];
  const visited = new Set<string>([parentId]);
  const visit = (currentParentId: string, relativeLevel: number) => {
    (children.get(currentParentId) ?? []).forEach(account => {
      if (visited.has(account.id)) return;
      visited.add(account.id);
      rows.push({ ...account, relativeLevel });
      if (account.isGroup) visit(account.id, relativeLevel + 1);
    });
  };
  visit(parentId, 0);
  return rows;
}

function typeLabel(type: AccountType) {
  return ({ asset: "Assets", liability: "Liabilities", equity: "Equity", income: "Income", expense: "Expenses" })[type];
}
