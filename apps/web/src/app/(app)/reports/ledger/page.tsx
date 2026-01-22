"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import FiltersBar from "@/components/app/filters-bar";
import DataTable, { Column } from "@/components/app/data-table";
import BsDateInput from "@/components/app/bs-date-input";
import { MoneyText } from "@/components/app/money";
import { getLedger } from "@/lib/api/reports";

type Row = {
  dateBs?: string;
  date?: string;
  ref?: string;
  memo?: string;
  debit?: number;
  credit?: number;
  balance?: number;
};

export default function LedgerPage() {
  const [from, setFrom] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [to, setTo] = React.useState<{ bs: string; ad: string }>({ bs: "", ad: "" });
  const [accountId, setAccountId] = React.useState("");
  const [partyId, setPartyId] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getLedger({
        from: from.ad || undefined,
        to: to.ad || undefined,
        fromBs: from.bs || undefined,
        toBs: to.bs || undefined,
        accountId: accountId || undefined,
        partyId: partyId || undefined,
      });

      const data = Array.isArray(res) ? res : res?.rows ?? res?.data ?? res?.items ?? [];
      setRows(data as Row[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load ledger");
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
      key: "date",
      header: "Date (BS)",
      width: 150,
      cell: (r) => (
        <div>
          <div className="mono-numbers">{r.dateBs ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{r.date ? r.date.slice(0, 10) : ""}</div>
        </div>
      ),
    },
    { key: "ref", header: "Ref", width: 140, cell: (r) => <div className="mono-numbers">{r.ref ?? "—"}</div> },
    { key: "memo", header: "Memo", cell: (r) => <div className="truncate">{r.memo ?? "—"}</div> },
    { key: "debit", header: <span className="w-full block text-right">Debit</span>, align: "right", width: 140, cell: (r) => <MoneyText value={Number(r.debit ?? 0)} /> },
    { key: "credit", header: <span className="w-full block text-right">Credit</span>, align: "right", width: 140, cell: (r) => <MoneyText value={Number(r.credit ?? 0)} /> },
    { key: "balance", header: <span className="w-full block text-right">Balance</span>, align: "right", width: 160, cell: (r) => <MoneyText value={Number(r.balance ?? 0)} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Ledger"
        description="Detailed ledger entries by account or party"
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
          <>
            <div className="w-full sm:w-[240px]">
              <BsDateInput label="From (BS)" valueBs={from.bs} valueAd={from.ad} onChange={setFrom} />
            </div>
            <div className="w-full sm:w-[240px]">
              <BsDateInput label="To (BS)" valueBs={to.bs} valueAd={to.ad} onChange={setTo} />
            </div>

            <div className="w-full sm:w-[220px]">
              <label className="text-xs text-muted-foreground">Account ID</label>
              <input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Account ID (optional)"
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="w-full sm:w-[220px]">
              <label className="text-xs text-muted-foreground">Party ID</label>
              <input
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                placeholder="Party ID (optional)"
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </>
        }
      />

      <DataTable rows={rows} columns={columns} loading={loading} emptyText="No ledger entries found" />
    </div>
  );
}
