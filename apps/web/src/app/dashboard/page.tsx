"use client";

import PageHeader from "@/components/app/page-header";
import { MoneyText } from "@/components/app/money";
import StatusBadge from "@/components/app/status-badge";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your business"
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Cash & Bank" value={125000} />
        <SummaryCard title="Receivables" value={84500} />
        <SummaryCard title="Payables" value={43200} />
        <SummaryCard title="This Month Sales" value={210000} />
      </div>

      {/* Recent activity */}
      <div className="mt-6 rounded-2xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>

        <div className="space-y-2 text-sm">
          <ActivityRow
            label="Sales Invoice #INV-1021"
            amount={12500}
            status="posted"
          />
          <ActivityRow
            label="Receipt from ABC Traders"
            amount={12500}
            status="posted"
          />
          <ActivityRow
            label="Journal Voucher"
            amount={8000}
            status="draft"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-lg font-semibold">
        <MoneyText value={value} />
      </div>
    </div>
  );
}

function ActivityRow({
  label,
  amount,
  status,
}: {
  label: string;
  amount: number;
  status: "draft" | "posted" | "void";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border px-3 py-2">
      <div className="truncate">{label}</div>
      <div className="flex items-center gap-3">
        <MoneyText value={amount} />
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
