"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import { listUsers } from "@/lib/api/users";

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
      setRows(data as UserRow[]);
    } catch {
      setRows([]);
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
    { key: "name", header: "Name", cell: (r) => <div className="font-medium">{r.name ?? "—"}</div> },
    { key: "email", header: "Email", cell: (r) => <div className="mono-numbers">{r.email}</div> },
    {
      key: "roles",
      header: "Roles",
      cell: (r) =>
        r.roles?.length ? (
          <div className="flex flex-wrap gap-1">
            {r.roles.slice(0, 3).map((x) => (
              <span key={x} className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {x}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <span
          className={[
            "rounded-full border px-2.5 py-1 text-xs",
            r.status === "disabled"
              ? "border-red-600/30 bg-red-600/10 text-red-700 dark:text-red-300"
              : "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
          ].join(" ")}
        >
          {r.status ?? "active"}
        </span>
      ),
      width: 110,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 140,
      cell: () => (
        <button className="rounded-xl border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          Manage
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage users and role assignments"
        actions={
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
            New User
          </button>
        }
      />

      <FiltersBar
        left={
          <div className="w-full sm:w-[320px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users…"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        }
        right={
          <button
            onClick={load}
            className="rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted"
          >
            Refresh
          </button>
        }
      />

      <DataTable rows={filtered} columns={columns} loading={loading} />
    </div>
  );
}
