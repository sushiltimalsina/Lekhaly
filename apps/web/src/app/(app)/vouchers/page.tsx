"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";
import { listVouchers } from "@/lib/api/vouchers";

type VoucherRow = {
  id: string;
  voucherNo?: string;
  voucherType?: string;
  partyName?: string;
  voucherDateBs?: string;
  voucherDate?: string;
  totalDebit?: number;
  totalCredit?: number;
  status?: DocStatus;
};

export default function VouchersPage() {
  const [rows, setRows] = React.useState<VoucherRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [from, setFrom] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [to, setTo] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [q, setQ] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const res: any = await listVouchers({ take: 50, skip: 0 });
      const data = Array.isArray(res) ? res : res?.data ?? res?.items ?? [];
      setRows(data as VoucherRow[]);
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
    const text = `${r.voucherNo ?? ""} ${r.voucherType ?? ""} ${r.partyName ?? ""}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const columns: Column<VoucherRow>[] = [
    {
      key: "voucher",
      header: "Voucher",
      cell: (r) => (
        <div>
          <div className="font-medium">
            {r.voucherNo ?? r.id.slice(0, 8).toUpperCase()}
          </div>
          <div className="text-xs text-muted-foreground">{r.voucherType ?? "—"}</div>
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
          <div className="mono-numbers">{r.voucherDateBs ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {r.voucherDate ? r.voucherDate.slice(0, 10) : ""}
          </div>
        </div>
      ),
    },
    {
      key: "dr",
      header: <span className="w-full block text-right">Debit</span>,
      align: "right",
      cell: (r) => <MoneyText value={Number(r.totalDebit ?? 0)} />,
      width: 140,
    },
    {
      key: "cr",
      header: <span className="w-full block text-right">Credit</span>,
      align: "right",
      cell: (r) => <MoneyText value={Number(r.totalCredit ?? 0)} />,
      width: 140,
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
        title="Vouchers"
        description="Draft, preview and post accounting vouchers"
        actions={
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
            New Voucher
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
                placeholder="Search voucher, type, party…"
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
