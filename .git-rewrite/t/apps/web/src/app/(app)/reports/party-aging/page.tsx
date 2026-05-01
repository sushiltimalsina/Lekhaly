"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";
import { getPartyAging } from "@/lib/api/reports";
import { useDateFormat } from "@/lib/date-format";
import { getDateLabel } from "@/lib/dates/display";

type Row = {
  partyName?: string;
  current?: number;
  days1to30?: number;
  days31to60?: number;
  days61to90?: number;
  days90plus?: number;
  total?: number;
};

export default function PartyAgingPage() {
  const { dateFormat } = useDateFormat();
  const [asOf, setAsOf] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getPartyAging({
        asOf: asOf.ad || undefined,
        asOfBs: asOf.bs || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load party aging");
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
      key: "party",
      header: "Party",
      cell: (r) => <div className="font-medium truncate">{r.partyName ?? "—"}</div>,
    },
    { key: "current", header: <span className="w-full block text-right">Current</span>, align: "right", width: 140, cell: (r) => <MoneyText value={Number(r.current ?? 0)} /> },
    { key: "1-30", header: <span className="w-full block text-right">1–30</span>, align: "right", width: 120, cell: (r) => <MoneyText value={Number(r.days1to30 ?? 0)} /> },
    { key: "31-60", header: <span className="w-full block text-right">31–60</span>, align: "right", width: 120, cell: (r) => <MoneyText value={Number(r.days31to60 ?? 0)} /> },
    { key: "61-90", header: <span className="w-full block text-right">61–90</span>, align: "right", width: 120, cell: (r) => <MoneyText value={Number(r.days61to90 ?? 0)} /> },
    { key: "90+", header: <span className="w-full block text-right">90+</span>, align: "right", width: 120, cell: (r) => <MoneyText value={Number(r.days90plus ?? 0)} /> },
    { key: "total", header: <span className="w-full block text-right">Total</span>, align: "right", width: 140, cell: (r) => <MoneyText value={Number(r.total ?? 0)} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Party Aging"
        description="Outstanding amounts grouped by aging buckets"
        actions={
          <button onClick={run} className="rounded-xl bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90">
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
            <BsDateInput label={getDateLabel(dateFormat, "As of")} valueBs={asOf.bs} valueAd={asOf.ad} onChange={setAsOf} />
          </div>
        }
      />

      <DataTable rows={rows} columns={columns} loading={loading} emptyText="No parties found" />
    </div>
  );
}

