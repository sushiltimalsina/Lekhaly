import * as React from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/app/page-header";
import DataTable, { Column } from "@/components/app/data-table";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { Search, Layers, FolderPlus, RefreshCw, ChevronRight, ChevronDown, BookPlus, Pencil, Trash2, RotateCcw, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api/client";
import { getAccountSummary, getAccountTypes, type AccountRecord, type AccountType, type AccountTypeOption, FALLBACK_ACCOUNT_TYPE_OPTIONS } from "@/lib/api/accounts";
import AddAccountGroupDialog from "@/components/app/add-account-group-dialog";
import { MoneyText } from "@/components/app/money";

type VisibleAccount = AccountRecord & { level: number; branchLines: boolean[]; isLastSibling: boolean };

export default function CoaPage() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogMode, setDialogMode] = React.useState<"group" | "account" | null>(null);
  const [editingAccount, setEditingAccount] = React.useState<AccountRecord | null>(null);
  const [removeCandidate, setRemoveCandidate] = React.useState<AccountRecord | null>(null);
  const [removalMessage, setRemovalMessage] = React.useState<{ id: string; name: string; deactivated: boolean } | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [typeOptions, setTypeOptions] = React.useState<AccountTypeOption[]>(FALLBACK_ACCOUNT_TYPE_OPTIONS);
  const [typeFilter, setTypeFilter] = React.useState<"all" | AccountType>("all");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  async function loadAccounts(resetFilters = false): Promise<AccountRecord[]> {
    if (resetFilters) {
      setQ("");
      setTypeFilter("all");
      setExpanded(new Set());
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getAccountSummary();
      const rows = Array.isArray(res) ? res : (res as any)?.data || [];
      setAccounts(rows);
      const groupIds = new Set<string>(rows.filter((account: AccountRecord) => account.isGroup).map((account: AccountRecord) => account.id));
      setExpanded(current => resetFilters ? new Set<string>() : new Set([...current].filter(id => groupIds.has(id))));
      return rows;
    } catch (err: any) {
      setError(err.message || "Failed to load Chart of Accounts");
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountCreated(created: AccountRecord) {
    const rows = await loadAccounts();
    const groupsToExpand = new Set<string>();
    if (created.isGroup) groupsToExpand.add(created.id);

    let parentId = created.parentId ?? null;
    while (parentId) {
      const parent = rows.find(account => account.id === parentId);
      if (!parent) break;
      if (parent.isGroup) groupsToExpand.add(parent.id);
      parentId = parent.parentId ?? null;
    }

    setExpanded(current => new Set([...current, ...groupsToExpand]));
  }

  function editAccount(account: AccountRecord) {
    setEditingAccount(account);
    setDialogMode(account.isGroup ? "group" : "account");
  }

  function closeAccountDialog() {
    setDialogMode(null);
    setEditingAccount(null);
  }

  async function removeAccount() {
    if (!removeCandidate) return;
    setRemoving(true);
    setError(null);
    try {
      const removed = await apiRequest<AccountRecord>({ method: "DELETE", path: `/accounts/${encodeURIComponent(removeCandidate.id)}` });
      const candidate = removeCandidate;
      setRemoveCandidate(null);
      await loadAccounts();
      setRemovalMessage({ id: candidate.id, name: candidate.name, deactivated: removed.isActive === false });
    } catch (err: any) {
      setError(err.message || "Failed to remove account");
    } finally {
      setRemoving(false);
    }
  }

  async function restoreAccount() {
    if (!removalMessage) return;
    try {
      await apiRequest({ method: "POST", path: `/accounts/${encodeURIComponent(removalMessage.id)}/restore` });
      await loadAccounts();
      setRemovalMessage(null);
    } catch (err: any) {
      setError(err.message || "Failed to restore account");
    }
  }

  React.useEffect(() => {
    let mounted = true;
    getAccountTypes()
      .then((options) => {
        if (!mounted) return;
        if (Array.isArray(options) && options.length > 0) setTypeOptions(options);
      })
      .catch(() => undefined);
    loadAccounts();
    return () => {
      mounted = false;
    };
  }, []);

  const typeLabels = React.useMemo(
    () => Object.fromEntries((typeOptions.length ? typeOptions : FALLBACK_ACCOUNT_TYPE_OPTIONS).map((option) => [option.value, option.label])),
    [typeOptions]
  );
  const filtered = buildVisibleAccounts(accounts, q, typeFilter, expanded);
  const groupIds = accounts.filter(account => account.isGroup).map(account => account.id);
  const allGroupsExpanded = groupIds.length > 0 && groupIds.every(id => expanded.has(id));
  const toggleAllGroups = () => setExpanded(current =>
    groupIds.length > 0 && groupIds.every(id => current.has(id)) ? new Set<string>() : new Set(groupIds)
  );
  const toggleGroup = (id: string) => setExpanded(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const stats = React.useMemo(() => {
    const normalizedTypes = (typeOptions.length ? typeOptions : FALLBACK_ACCOUNT_TYPE_OPTIONS).map(({ value }) => value);
    const s = Object.fromEntries(normalizedTypes.map((type) => [type, 0])) as Record<AccountType, number>;

    accounts.forEach(acc => {
      if (!acc.isGroup && s[acc.type as AccountType] !== undefined) {
        s[acc.type as AccountType] += 1;
      }
    });
    return s;
  }, [accounts, typeOptions]);

  const columns: Column<VisibleAccount>[] = [
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
          {typeLabels[r.type as AccountType] ?? r.type}
        </span>
      ),
      width: 160,
    },
    {
      key: "name",
      header: "Account Name",
      cell: (r) => (
        <div className={cn("flex min-h-12 items-center rounded-lg py-1.5 transition-colors", r.isGroup ? "bg-slate-50/80 dark:bg-slate-800/30" : "")}>
          {r.branchLines.slice(0, r.level - 1).map((continues, index) => (
            <span key={index} className="relative h-9 w-6 shrink-0">
              {continues && <span className="absolute inset-y-0 left-1/2 border-l-2 border-slate-300 dark:border-slate-600" />}
            </span>
          ))}
          {r.level > 0 && (
            <span className="relative h-9 w-6 shrink-0">
              <span className={cn("absolute left-1/2 border-l-2 border-slate-300 dark:border-slate-600", r.isLastSibling ? "top-0 bottom-1/2" : "inset-y-0")} />
              <span className="absolute left-1/2 right-0 top-1/2 border-t-2 border-slate-300 dark:border-slate-600" />
            </span>
          )}
          <div className="flex min-w-0 items-center gap-3">
            {r.isGroup ? (
              <button
                type="button"
                aria-label={`${expanded.has(r.id) ? "Collapse" : "Expand"} group ${r.name}`}
                aria-expanded={expanded.has(r.id)}
                title={`${expanded.has(r.id) ? "Collapse" : "Expand"} this group`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleGroup(r.id);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              >
                <span className="sr-only">{expanded.has(r.id) ? `Collapse ${r.name}` : `Expand ${r.name}`}</span>
                {expanded.has(r.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
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
            {r.isGroup ? (
              <button type="button" onClick={() => navigate(`/coa/${encodeURIComponent(r.id)}`)} className="text-left">
                <span className="block text-[15px] font-bold text-slate-900 dark:text-slate-100">{r.name}</span>
                {r.level > 0 && (
                  <span className="mt-1 inline-flex rounded-md border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/50 dark:text-indigo-300">
                    Group
                  </span>
                )}
              </button>
            ) : (
              <button type="button" onClick={() => navigate(`/reports/ledger?accountId=${encodeURIComponent(r.id)}`)} className="flex min-w-0 items-center gap-2 text-left text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-300 dark:hover:text-primary">
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Ledger</span>
                {r.isContra && <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">{r.type === "income" ? "Contra-Income" : "Contra-Expense"}</span>}
              </button>
            )}
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
      key: "actions",
      header: "Actions",
      align: "right",
      width: 100,
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <button type="button" title={`Edit ${r.name}`} aria-label={`Edit ${r.name}`} onClick={() => editAccount(r)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" title={`Remove ${r.name}`} aria-label={`Remove ${r.name}`} onClick={() => { setError(null); setRemoveCandidate(r); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader
          title="Chart of Accounts"
          description="Organize your financial structure with hierarchical account groups and postable ledgers."
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => loadAccounts(true)} disabled={loading} className="rounded-2xl h-12 px-6 border-border/60 glass-panel bg-white/50 dark:bg-black/5 hover:bg-primary/5 transition-all font-bold">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Reload
          </Button>
          <Button
            onClick={() => { setEditingAccount(null); setDialogMode("group"); }}
            variant="outline"
            className="h-12 rounded-2xl border-indigo-600/30 px-5 font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <FolderPlus className="mr-2 h-5 w-5" />
            Add Account Group
          </Button>
          <Button onClick={() => { setEditingAccount(null); setDialogMode("account"); }} className="h-12 rounded-2xl bg-emerald-600 px-5 font-bold text-white shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700">
            <BookPlus className="mr-2 h-5 w-5" />
            Add Ledger Account
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => loadAccounts(true)}>Retry</Button>
        </div>
      )}

      {removalMessage && (
        <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          <span>{removalMessage.name} {removalMessage.deactivated ? "deactivated" : "deleted"}.</span>
          {removalMessage.deactivated && <Button variant="outline" size="sm" onClick={restoreAccount}><RotateCcw className="mr-2 h-4 w-4" />Restore</Button>}
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {(typeOptions.length ? typeOptions : FALLBACK_ACCOUNT_TYPE_OPTIONS).map((option) => (
          <StatCard
            key={option.value}
            title={option.label}
            count={stats[option.value as AccountType] ?? 0}
            type={option.value}
            icon={Layers}
            active={typeFilter === option.value}
            onClick={() => setTypeFilter((current) => current === option.value ? "all" : option.value)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-0 rounded-[2.5rem] border border-border/50 bg-card overflow-hidden shadow-2xl shadow-foreground/[0.02]">
        <div className="p-4 md:p-5 bg-muted/20 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border/40">
          <div className="relative w-full sm:w-[360px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search accounts or codes..."
              className="pl-10 h-11 rounded-xl bg-white dark:bg-muted/10 border-border/50 focus-visible:ring-primary/20 text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="whitespace-nowrap text-sm text-muted-foreground">{filtered.length} of {accounts.length}</span>
            <button
              type="button"
              title={allGroupsExpanded ? "Collapse all groups" : "Expand all groups"}
              aria-label={allGroupsExpanded ? "Collapse all groups" : "Expand all groups"}
              onClick={toggleAllGroups}
              disabled={loading || groupIds.length === 0}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="px-2">
          <DataTable
            rows={filtered}
            columns={columns}
            loading={loading}
            emptyText="No account groups to display. Select a financial type to view ungrouped accounts."
            className="border-none shadow-none bg-transparent"
            rowClassName="hover:bg-primary/[0.02] cursor-pointer group/row transition-all duration-300"
          />
        </div>
      </div>

      {removeCandidate && (
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="remove-account-title" className="w-full max-w-md space-y-5 rounded-2xl border bg-background p-6 shadow-2xl">
            <div>
              <h2 id="remove-account-title" className="text-lg font-bold">Remove {removeCandidate.isGroup ? "group" : "ledger"}?</h2>
              <p className="mt-2 text-sm text-muted-foreground">{removeCandidate.code} · {removeCandidate.name}</p>
              <p className="mt-3 text-sm text-muted-foreground">Unused accounts are permanently deleted. Accounts referenced by financial records are deactivated to preserve history. Groups must have no child accounts.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRemoveCandidate(null)} disabled={removing}>Cancel</Button>
              <Button variant="destructive" onClick={removeAccount} disabled={removing || (removeCandidate.isGroup && accounts.some(account => account.parentId === removeCandidate.id))}>
                {removing ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddAccountGroupDialog
        open={dialogMode === "group" && (!editingAccount || Boolean(editingAccount.isGroup))}
        mode="group"
        onClose={closeAccountDialog}
        onSuccess={handleAccountCreated}
        initialType={editingAccount?.type ?? "asset"}
        editingAccount={editingAccount?.isGroup ? editingAccount : undefined}
        parentOptions={accounts.filter(a => a.isGroup).map(({ id, name, code, type, parentId }) => ({ id, name, code, type, parentId }))}
      />
      <AddAccountGroupDialog
        open={dialogMode === "account" && (!editingAccount || !editingAccount.isGroup)}
        mode="account"
        onClose={closeAccountDialog}
        onSuccess={handleAccountCreated}
        initialType={editingAccount?.type ?? "asset"}
        initialParentId={editingAccount?.parentId ?? undefined}
        editingAccount={editingAccount && !editingAccount.isGroup ? editingAccount : undefined}
        parentOptions={accounts.filter(a => a.isGroup).map(({ id, name, code, type, parentId }) => ({ id, name, code, type, parentId }))}
      />
    </div>
  );
}

function buildVisibleAccounts(
  accounts: AccountRecord[],
  query: string,
  typeFilter: "all" | AccountRecord["type"],
  expanded: Set<string>
) {
  const children = new Map<string | null, AccountRecord[]>();
  accounts.forEach((account) => {
    const parentId = account.parentId ?? null;
    const siblings = children.get(parentId) ?? [];
    siblings.push(account);
    children.set(parentId, siblings);
  });
  children.forEach((siblings) => siblings.sort((a, b) => Number(b.isGroup) - Number(a.isGroup) || a.code.localeCompare(b.code, undefined, { numeric: true })));

  const normalizedQuery = query.trim().toLowerCase();
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const searchText = (value: string | null | undefined) => (value ?? "").toLowerCase();
  const matches = (account: AccountRecord) => {
    const typeMatches = typeFilter === "all" || account.type === typeFilter;
    if (!typeMatches) return false;
    if (queryTerms.length === 0) return true;
    const haystack = `${account.code ?? ""} ${account.name ?? ""} ${account.type ?? ""}`.toLowerCase();
    return queryTerms.every((term) => haystack.includes(term));
  };
  const hasMatchingDescendant = (account: AccountRecord): boolean =>
    (children.get(account.id) ?? []).some((child) => matches(child) || hasMatchingDescendant(child));
  const visible: VisibleAccount[] = [];
  const visit = (account: AccountRecord, level: number, branchLines: boolean[], isLastSibling: boolean) => {
    const constrained = normalizedQuery.length > 0 || typeFilter !== "all";
    const shouldDisplay = !constrained || matches(account) || hasMatchingDescendant(account);
    if (!shouldDisplay) return;
    visible.push({ ...account, level, branchLines, isLastSibling });
    const shouldExpand = expanded.has(account.id);
    if (shouldExpand) {
      const descendants = children.get(account.id) ?? [];
      descendants.forEach((child, index) => visit(child, level + 1, [...branchLines, !isLastSibling], index === descendants.length - 1));
    }
  };
  const accountIds = new Set(accounts.map(account => account.id));
  const roots = accounts
    .filter(account => !account.parentId || !accountIds.has(account.parentId))
    .sort((a, b) => Number(b.isGroup) - Number(a.isGroup) || a.code.localeCompare(b.code, undefined, { numeric: true }));
  roots.forEach((root, index) => visit(root, 0, [], index === roots.length - 1));
  return visible;
}

function StatCard({ title, count, type, icon: Icon, active, onClick }: { title: string, count: number, type: AccountRecord["type"], icon: any, active: boolean, onClick: () => void }) {
  const colors: any = {
    asset: "border-l-blue-500 bg-blue-500/5 text-blue-600 ring-blue-500/10",
    liability: "border-l-orange-500 bg-orange-500/5 text-orange-600 ring-orange-500/10",
    equity: "border-l-indigo-500 bg-indigo-500/5 text-indigo-600 ring-indigo-500/10",
    income: "border-l-emerald-500 bg-emerald-500/5 text-emerald-600 ring-emerald-500/10",
    expense: "border-l-red-500 bg-red-500/5 text-red-600 ring-red-500/10"
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("w-full rounded-2xl border bg-card p-4 text-left shadow-lg shadow-foreground/[0.02] border-l-4 transition-all hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", colors[type], active && "ring-2 ring-primary ring-offset-2")}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</div>
        <Icon className="h-3.5 w-3.5 opacity-20" />
      </div>
      <div className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{count}</div>
      <div className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Total Ledgers</div>
    </button>
  );
}
