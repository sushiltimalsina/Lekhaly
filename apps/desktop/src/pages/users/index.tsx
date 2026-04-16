import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
import { listUsers } from "@/lib/api/users";
import { Plus, Search, RefreshCw, UserCheck, Shield, Mail, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  name?: string;
  email: string;
  roles?: string[];
  status?: "active" | "disabled";
};

export default function UsersPage() {
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<UserRow[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res: any = await listUsers({ take: 50, skip: 0 });
      const data = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
      setRows(data.length > 0 ? data : [
        { id: "u1", name: "Sushil Timalsina", email: "sushil@lekhaly.com", roles: ["admin", "owner"], status: "active" },
        { id: "u2", name: "Ramesh Sharma", email: "ramesh@example.com", roles: ["accountant"], status: "active" },
        { id: "u3", name: "Anita Maharjan", email: "anita@example.com", roles: ["manager"], status: "active" },
        { id: "u4", name: "Binod Rai", email: "binod@example.com", roles: ["sales"], status: "disabled" },
      ]);
    } catch {
      setRows([
        { id: "u1", name: "Sushil Timalsina", email: "sushil@lekhaly.com", roles: ["admin", "owner"], status: "active" },
        { id: "u2", name: "Ramesh Sharma", email: "ramesh@example.com", roles: ["accountant"], status: "active" },
        { id: "u3", name: "Anita Maharjan", email: "anita@example.com", roles: ["manager"], status: "active" },
        { id: "u4", name: "Binod Rai", email: "binod@example.com", roles: ["sales"], status: "disabled" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.name ?? ""} ${r.email}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "User Details",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-1 ring-indigo-500/20">
            {(r.name || r.email).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-foreground">{r.name ?? "Unnamed User"}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {r.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "roles",
      header: "Roles & Permissions",
      cell: (r) =>
        r.roles?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {r.roles.map((x) => (
              <span key={x} className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-700/10">
                <Shield className="mr-1 h-2.5 w-2.5" />
                {x}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">No roles assigned</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
            r.status === "disabled"
              ? "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400"
              : "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400"
          )}
        >
          <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full fill-current", r.status === "disabled" ? "bg-red-600" : "bg-emerald-600")} />
          {r.status ?? "active"}
        </span>
      ),
      width: 120,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 100,
      cell: () => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Invite users, manage roles, and monitor system access."
        actions={
          <Button className="shadow-lg shadow-primary/20 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-indigo-500">
            <div className="text-xs font-medium text-muted-foreground">Total Users</div>
            <div className="mt-1 text-2xl font-bold">{rows.length}</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-emerald-500">
            <div className="text-xs font-medium text-muted-foreground">Active Now</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">
              {rows.filter(u => u.status === 'active').length}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-orange-500">
            <div className="text-xs font-medium text-muted-foreground">Admins</div>
            <div className="mt-1 text-2xl font-bold text-orange-600">
              {rows.filter(u => u.roles?.includes('admin')).length}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-l-4 border-l-blue-500">
            <div className="text-xs font-medium text-muted-foreground">Last Invited</div>
            <div className="mt-1 text-lg font-bold">2 days ago</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
          <FiltersBar
            className="bg-transparent p-0 mb-0"
            left={
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-9"
                />
              </div>
            }
            right={
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={load} disabled={loading}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                  Sync
                </Button>
                <Button variant="outline">Logs</Button>
              </div>
            }
          />
          <DataTable rows={filtered} columns={columns} loading={loading} className="border-0 shadow-none" />
        </div>
      </div>
    </div>
  );
}
