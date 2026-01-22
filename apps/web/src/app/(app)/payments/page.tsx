"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";

type PaymentRow = {
  id: string;
  type: "receipt" | "payment";
  refNo?: string;
  partyName?: string;
  dateBs?: string;
  date?: string;
  amount?: number;
  status?: DocStatus;
};

export default function PaymentsPage() {
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [to, setTo] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });

  // Placeholder rows until payment/receipt mapping is implemented
  const [rows] = React.useState<PaymentRow[]>([
    {
      id: "p1",
      type: "receipt",
      refNo: "RCPT-0009",
      partyName: "ABC Traders",
      dateBs: "2082-05-01",
      date: "2026-01-10T00:00:00.000Z",
      amount: 12500,
      status: "posted",
    },
    {
      id: "p2",
      type: "payment",
      refNo: "PAY-0012",
      partyName: "Everest Distributors",
      dateBs: "2082-05-03",
      date: "2026-01-12T00:00:00.000Z",
      amount: 42000,
      status: "draft",
    },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.refNo ?? ""} ${r.partyName ?? ""} ${r.type}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<PaymentRow>[] = [
    {
      key: "ref",
      header: "Reference",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.refNo ?? r.id.slice(0, 8).toUpperCase()}</div>
          <div className="text-xs text-muted-foreground">{r.type.toUpperCase()}</div>
        </div>
      ),
    },
    { key: "party", header: "Party", cell: (r) => <div className="truncate">{r.partyName ?? "—"}</div> },
    {
      key: "date",
      header: "Date (BS)",
      cell: (r) => (
        <div>
          <div className="mono-numbers">{r.dateBs ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{r.date ? r.date.slice(0, 10) : ""}</div>
        </div>
      ),
    },
    {
      key: "amount",
      header: <span className="w-full block text-right">Amount</span>,
      align: "right",
      cell: (r) => <MoneyText value={Number(r.amount ?? 0)} />,
      width: 160,
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
        title="Payments"
        description="Receipts and payments"
        actions={
          <div className="flex gap-2">
            <button className="rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted">
              New Receipt
            </button>
            <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
              New Payment
            </button>
          </div>
        }
      />

      <FiltersBar
        left={
          <>
            <div className="w-full sm:w-[260px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search receipt/payment…"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <BsDateInput label="From (BS)" valueBs={from.bs} valueAd={from.ad} onChange={setFrom} />
            </div>
            <div className="w-full sm:w-[220px]">
              <BsDateInput label="To (BS)" valueBs={to.bs} valueAd={to.ad} onChange={setTo} />
            </div>
          </>
        }
      />

      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}
