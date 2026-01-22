"use client";

import PageHeader from "@/components/app/page-header";

const reports = [
  { title: "Trial Balance", desc: "Account balances for a period", href: "/reports/trial-balance" },
  { title: "Profit & Loss", desc: "Income vs expense summary", href: "/reports/profit-loss" },
  { title: "Balance Sheet", desc: "Assets, liabilities and equity", href: "/reports/balance-sheet" },
  { title: "Party Aging", desc: "Customer/vendor aging buckets", href: "/reports/party-aging" },
  { title: "Ledger", desc: "Detailed ledger by account/party", href: "/reports/ledger" },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Financial statements and exports" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <a
            key={r.href}
            href={r.href}
            className="rounded-2xl border bg-card p-4 hover:bg-muted/30"
          >
            <div className="text-sm font-semibold">{r.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{r.desc}</div>
            <div className="mt-3 text-xs text-primary">Open</div>
          </a>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-4">
        <div className="text-sm font-semibold">Export</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Export trial balance, ledger, vouchers and more for audit and compliance.
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
            Export report
          </button>
          <button className="rounded-xl border bg-background px-3 py-2 text-sm hover:bg-muted">
            Export audit log
          </button>
        </div>
      </div>
    </div>
  );
}
