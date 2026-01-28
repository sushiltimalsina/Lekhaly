"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import StatusBadge, { DocStatus } from "@/components/app/status-badge";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";
import DateDisplay from "@/components/app/date-display";
import { useDateFormat } from "@/lib/date-format";
import { getDateLabel } from "@/lib/dates/display";
import Link from "next/link";
import { Plus } from "lucide-react";

type PaymentRow = {
  id: string;
  refNo?: string;
  partyName?: string;
  dateBs?: string;
  date?: string;
  amount?: number;
  status?: DocStatus;
};

export default function PaymentsPage() {
  const { dateFormat } = useDateFormat();
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [to, setTo] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });

  const [rows] = React.useState<PaymentRow[]>([
    {
      id: "p1",
      refNo: "PAY-0001",
      partyName: "ABC Traders",
      dateBs: "2082-05-01",
      date: "2026-01-10T00:00:00.000Z",
      amount: 12500,
      status: "posted",
    },
    {
      id: "p2",
      refNo: "PAY-0002",
      partyName: "Everest Distributors",
      dateBs: "2082-05-03",
      date: "2026-01-12T00:00:00.000Z",
      amount: 42000,
      status: "draft",
    },
  ]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    return `${r.refNo ?? ""} ${r.partyName ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });

  const columns: Column<PaymentRow>[] = [
    {
      key: "ref",
      header: "Payment #",
      cell: (r) => <div className="font-medium">{r.refNo ?? r.id.slice(0, 8).toUpperCase()}</div>,
    },
    { key: "party", header: "Payee", cell: (r) => <div className="truncate">{r.partyName ?? "—"}</div> },
    {
      key: "date",
      header: getDateLabel(dateFormat),
      cell: (r) => <DateDisplay ad={r.date} bs={r.dateBs} />,
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
    <div className="space-y-6">
      <PageHeader
        title="Cash Payments"
        description="View and manage payments to vendors/expenses"
        actions={
          <Link
            href="/payments/create"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 shadow-sm shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Payment
          </Link>
        }
      />

      <FiltersBar
        left={
          <>
            <div className="w-full sm:w-[260px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search payment…"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <BsDateInput label={getDateLabel(dateFormat, "From")} valueBs={from.bs} valueAd={from.ad} onChange={setFrom} />
            </div>
            <div className="w-full sm:w-[220px]">
              <BsDateInput label={getDateLabel(dateFormat, "To")} valueBs={to.bs} valueAd={to.ad} onChange={setTo} />
            </div>
          </>
        }
      />

      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}
