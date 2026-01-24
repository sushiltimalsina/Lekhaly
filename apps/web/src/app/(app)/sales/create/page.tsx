"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createInvoiceDraft } from "@/lib/api/invoices";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { getStockReport, type StockReportRow } from "@/lib/api/inventory";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

type Line = {
  itemId: string;
  qty: string;
  rate: string;
  description?: string;
};

export default function SalesCreatePage() {
  const [parties, setParties] = React.useState<PartyRecord[]>([]);
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [items, setItems] = React.useState<StockReportRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    partyId: "",
    receivableAccountId: "",
    date: "",
    memo: "",
  });
  const [lines, setLines] = React.useState<Line[]>([
    { itemId: "", qty: "1", rate: "" },
  ]);

  React.useEffect(() => {
    let alive = true;
    Promise.all([
      listParties({ type: "customer", take: 200 }),
      listAccounts({ type: "asset", take: 200 }),
      getStockReport(),
    ])
      .then(([p, a, i]) => {
        if (!alive) return;
        const pData = Array.isArray(p) ? p : p?.items ?? p?.data ?? [];
        const aData = Array.isArray(a) ? a : a?.items ?? a?.data ?? [];
        const iData = Array.isArray(i) ? i : i?.items ?? i?.data ?? [];
        setParties(pData);
        setAccounts(aData);
        setItems(iData);
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(e?.message ?? "Failed to load data.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => {
    setLines((prev) => [...prev, { itemId: "", qty: "1", rate: "" }]);
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.partyId || !form.receivableAccountId) {
      setError("Party and receivable account are required.");
      return;
    }

    const payload = lines
      .filter((l) => l.itemId && Number(l.qty) > 0)
      .map((l) => ({
        itemId: l.itemId,
        qty: Number(l.qty),
        rate: Number(l.rate || 0),
        description: l.description || undefined,
      }));

    if (!payload.length) {
      setError("Add at least one item line.");
      return;
    }

    setLoading(true);
    try {
      const res: any = await createInvoiceDraft({
        type: "sales",
        partyId: form.partyId,
        date: form.date || undefined,
        receivableAccountId: form.receivableAccountId,
        items: payload,
      });
      const id = res?.id ?? res?.invoiceId ?? res?.data?.id;
      setSuccess(id ? `Draft created: ${id}` : "Draft created.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create sales invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Sales Invoice"
        description="Create a sales invoice draft with items and taxes."
      />

      <form onSubmit={submit} className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Customer</span>
            <select
              value={form.partyId}
              onChange={(e) => setForm((f) => ({ ...f, partyId: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select customer</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Receivable Account</span>
            <select
              value={form.receivableAccountId}
              onChange={(e) => setForm((f) => ({ ...f, receivableAccountId: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code ? `${a.code} - ${a.name}` : a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Invoice Date</span>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </label>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Items</div>
            <Button type="button" variant="outline" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add line
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <select
                  value={line.itemId}
                  onChange={(e) => updateLine(idx, { itemId: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select item</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} {it.hsCode ? `(${it.hsCode})` : ""}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.qty}
                  onChange={(e) => updateLine(idx, { qty: e.target.value })}
                  placeholder="Qty"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.rate}
                  onChange={(e) => updateLine(idx, { rate: e.target.value })}
                  placeholder="Rate"
                />
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs text-red-600 hover:bg-red-50",
                    lines.length === 1 && "opacity-50 pointer-events-none"
                  )}
                  title="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}

