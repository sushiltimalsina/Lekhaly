"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";
import { getBalanceSheet } from "@/lib/api/reports";

type Row = {
  section?: string; // assets/liabilities/equity
  name?: string;
  amount?: number;
};

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getBalanceSheet({
        asOf: asOf.ad || undefined,
        asOfBs: asOf.bs || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load balance sheet");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Line",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name ?? "—"}</div>
          {r.section ? <div className="text-xs text-muted-foreground">{r.section}</div> : null}
        </div>
      ),
    },
    {
      key: "amount",
      header: <span className="w-full block text-right">Amount</span>,
      align: "right",
      width: 220,
      cell: (r) => <MoneyText value={Number(r.amount ?? 0)} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Balance Sheet"
        description="Assets, liabilities and equity as of a date"
        actions={
          <button
            onClick={run}
            className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90"
          >
            Run report
          </button>
        }
      />

      {error ? (
        <div className="mb-3 rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <FiltersBar
        left={
          <div className="w-full sm:w-[240px]">
            <BsDateInput label="As of (BS)" valueBs={asOf.bs} valueAd={asOf.ad} onChange={setAsOf} />
          </div>
        }
      />

      <DataTable rows={rows} columns={columns} loading={loading} emptyText="No lines found" />
    </div>
  );
}
