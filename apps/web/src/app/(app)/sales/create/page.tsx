"use client";

import * as React from "react";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import BsDateInput from "@/components/app/bs-date-input";
import { createInvoiceDraft } from "@/lib/api/invoices";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { getStockReport, type StockReportRow } from "@/lib/api/inventory";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Eye, Check, Save, Search } from "lucide-react";
import { toBs } from "@/lib/dates/bs";

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
    date: { bs: "", ad: "" },
    dueDate: { bs: "", ad: "" },
    memo: "",
  });
  const [lines, setLines] = React.useState<Line[]>([
    { itemId: "", qty: "1", rate: "" },
  ]);

  React.useEffect(() => {
    const now = new Date();
    const ad = now.toISOString().slice(0, 10);
    const bs = toBs(ad);
    setForm((f) => ({
      ...f,
      date: { bs, ad },
      dueDate: f.dueDate.ad || f.dueDate.bs ? f.dueDate : { bs, ad }
    }));
  }, []);

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
        date: form.date.ad || undefined,
        dateBs: form.date.bs || undefined,
        dueDate: form.dueDate.ad || undefined,
        dueDateBs: form.dueDate.bs || undefined,
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

  const lineTotals = lines.map((l) => ({
    qty: Number(l.qty || 0),
    rate: Number(l.rate || 0),
  }));
  const subtotal = lineTotals.reduce((sum, l) => sum + l.qty * l.rate, 0);
  const taxTotal = 0;
  const total = subtotal + taxTotal;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card/80 p-6 shadow-xl shadow-primary/5">
        <PageHeader
          title="New Sales Invoice"
          description="Draft invoice for sales and collections."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" className="rounded-full px-4">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" type="button" className="rounded-full px-4">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button type="submit" form="sales-invoice-form" disabled={loading} className="rounded-full px-5">
                <Check className="mr-2 h-4 w-4" />
                Post
              </Button>
            </div>
          }
        />

      <form id="sales-invoice-form" onSubmit={submit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
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

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Customer</div>
            <Button variant="outline" type="button" className="rounded-full px-4">
              New Customer
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Select customer</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={form.partyId}
                  onChange={(e) => setForm((f) => ({ ...f, partyId: e.target.value }))}
                  className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
                >
                  <option value="">Select customer</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className="space-y-1 text-sm">
              <BsDateInput
                label="Invoice Date"
                valueBs={form.date.bs}
                valueAd={form.date.ad}
                onChange={(next) => setForm((f) => ({ ...f, date: next }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <BsDateInput
                label="Due Date"
                valueBs={form.dueDate.bs}
                valueAd={form.dueDate.ad}
                onChange={(next) => setForm((f) => ({ ...f, dueDate: next }))}
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Reference No.</span>
              <Input
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="Enter reference (optional)"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
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
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Items</div>
            <Button type="button" variant="outline" onClick={addLine} className="rounded-full px-4">
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground">Item</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground">Qty</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground">Rate</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const qty = Number(line.qty || 0);
                  const rate = Number(line.rate || 0);
                  const amt = qty * rate;
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">
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
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.qty}
                          onChange={(e) => updateLine(idx, { qty: e.target.value })}
                          placeholder="Qty"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.rate}
                          onChange={(e) => updateLine(idx, { rate: e.target.value })}
                          placeholder="Rate"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <MoneyText value={amt} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className={cn(
                            "inline-flex items-center justify-center rounded-md border px-2 py-2 text-xs text-red-600 hover:bg-red-50",
                            lines.length === 1 && "opacity-50 pointer-events-none"
                          )}
                          title="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t bg-muted/30">
                  <td className="px-3 py-2 text-right font-medium" colSpan={3}>
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    <MoneyText value={subtotal} />
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
          <div className="text-sm font-semibold">Memo</div>
          <Input
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            placeholder="Goods and services provided"
          />
        </div>

        <aside className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
          <div className="text-sm font-semibold">Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <MoneyText value={subtotal} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <MoneyText value={0} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <MoneyText value={taxTotal} />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 font-semibold">
              <span>Total</span>
              <MoneyText value={total} />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="text-xs text-muted-foreground">Additional notes</div>
            <Input
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
              placeholder="Additional notes..."
            />
          </div>
        </aside>
      </form>
      </div>
    </div>
  );
}
