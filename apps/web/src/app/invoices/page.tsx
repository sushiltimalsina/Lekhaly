"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";
import { listInvoices } from "@/lib/api/invoices";

type InvoiceRow = {
  id: string;
  invoiceNo?: string;
  partyName?: string;
  dateBs?: string;
  date?: string;
  dueDateBs?: string;
  dueDate?: string;
  total?: number;
  status?: DocStatus;
};

export default function InvoicesPage() {
  const [rows, setRows] = React.useState<InvoiceRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  // simple filters (server filter later)
  const [from, setFrom] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [to, setTo] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [q, setQ] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const res: any = await listInvoices({ take: 50, skip: 0 });
      // backend shape unknown; normalize safely
      const data = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
      setRows(data as InvoiceRow[]);
    } catch (e) {
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
    const text = `${r.invoiceNo ?? ""} ${r.partyName ?? ""}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const columns: Column<InvoiceRow>[] = [
    {
      key: "invoiceNo",
      header: "Invoice",
      cell: (r) => (
        <div className="font-medium">
          {r.invoiceNo ?? r.id.slice(0, 8).toUpperCase()}
        </div>
      ),
    },
    {
      key: "party",
      header: "Party",
      cell: (r) => <div className="truncate">{r.partyName ?? "—"}</div>,
    },
    {
      key: "date",
      header: "Date (BS)",
      cell: (r) => (
        <div>
          <div className="mono-numbers">{r.dateBs ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {r.date ? r.date.slice(0, 10) : ""}
          </div>
        </div>
      ),
    },
    {
      key: "due",
      header: "Due (BS)",
      cell: (r) => (
        <div>
          <div className="mono-numbers">{r.dueDateBs ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {r.dueDate ? r.dueDate.slice(0, 10) : ""}
          </div>
        </div>
      ),
    },
    {
      key: "total",
      header: <span className="w-full block text-right">Amount</span>,
      align: "right",
      cell: (r) => <MoneyText value={Number(r.total ?? 0)} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={(r.status ?? "draft") as DocStatus} />,
      width: 110,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 120,
      cell: () => (
        <button className="rounded-xl border bg-background px-3 py-1.5 text-xs hover:bg-muted">
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Create, preview and post sales invoices"
        actions={
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
            New Invoice
          </button>
        }
      />

      <FiltersBar
        left={
          <>
            <div className="w-full sm:w-[260px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search invoice or party…"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="w-full sm:w-[220px]">
              <BsDateInput
                label="From (BS)"
                valueBs={from.bs}
                valueAd={from.ad}
                onChange={(v) => setFrom(v)}
              />
            </div>

            <div className="w-full sm:w-[220px]">
              <BsDateInput
                label="To (BS)"
                valueBs={to.bs}
                valueAd={to.ad}
                onChange={(v) => setTo(v)}
              />
            </div>
          </>
        }
        right={
          <>
            <button
              onClick={load}
              className="rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              Refresh
            </button>
          </>
        }
      />

      <DataTable rows={filtered} columns={columns} loading={loading} />
    </div>
  );
}
