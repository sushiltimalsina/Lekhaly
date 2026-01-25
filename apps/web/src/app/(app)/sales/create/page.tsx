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
import { Plus, Trash2, Save, Send, Search } from "lucide-react";
import { toBs } from "@/lib/dates/bs";

type Line = {
  itemId: string;
  qty: string;
  rate: string;
  description?: string;
};

export default function SalesCreatePage() {
  const [mounted, setMounted] = React.useState(false);
  const [parties, setParties] = React.useState<PartyRecord[]>([]);
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [items, setItems] = React.useState<StockReportRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    partyId: "",
    receivableAccountId: "",
    date: { bs: "", ad: "" },
    referenceNo: "",
    memo: "",
    notes: "",
  });

  const [lines, setLines] = React.useState<Line[]>([
    { itemId: "", qty: "1", rate: "" },
  ]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const now = new Date();
    const ad = now.toISOString().slice(0, 10);
    const bs = toBs(ad);
    setForm((f) => ({ ...f, date: { bs, ad } }));
  }, []);

  React.useEffect(() => {
    let alive = true;
    Promise.all([
      listParties({ type: "customer", take: 100 }),
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
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  };

  const addLine = () => setLines((prev) => [...prev, { itemId: "", qty: "1", rate: "" }]);

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildPayload = () => {
    if (!form.partyId || !form.receivableAccountId) {
      throw new Error("Customer and receivable account are required.");
    }

    const payload = lines
      .filter((l) => l.itemId && Number(l.qty) > 0)
      .map((l) => ({
        itemId: l.itemId,
        qty: Number(l.qty),
        rate: Number(l.rate || 0),
        description: l.description || undefined,
      }));

    if (!payload.length) throw new Error("Add at least one item line.");

    return {
      type: "sales" as const,
      partyId: form.partyId,
      date: form.date.ad || undefined,
      dateBs: form.date.bs || undefined,
      receivableAccountId: form.receivableAccountId,
      items: payload,
      // backend schema does not have memo/reference/notes currently for InvoiceDraftInput
      // keep these in UI for now; wire later if API adds fields.
    };
  };

  const onSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = buildPayload();
      const res: any = await createInvoiceDraft(payload);
      const id = res?.id ?? res?.invoiceId ?? res?.data?.id;
      setSuccess(id ? `Saved draft: ${id}` : "Saved draft.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save invoice.");
    } finally {
      setLoading(false);
    }
  };

  const onSend = async () => {
    setError(null);
    setSuccess(null);
    setSending(true);
    try {
      const payload = buildPayload();
      const res: any = await createInvoiceDraft(payload);
      const id = res?.id ?? res?.invoiceId ?? res?.data?.id;
      setSuccess(id ? `Draft ready to send: ${id}` : "Draft ready to send.");
      // NOTE: actual "send" action (email/whatsapp) should be implemented via your outbox/send APIs later.
    } catch (e: any) {
      setError(e?.message ?? "Failed to send invoice.");
    } finally {
      setSending(false);
    }
  };

  const lineTotals = lines.map((l) => ({
    qty: Number(l.qty || 0),
    rate: Number(l.rate || 0),
  }));

  const subtotal = lineTotals.reduce((sum, l) => sum + l.qty * l.rate, 0);
  const discount = 0;
  const taxTotal = 0;
  const total = subtotal - discount + taxTotal;

  if (!mounted) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-xl shadow-slate-200/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20">
        <PageHeader
          title="New Sales Invoice"
          description="Draft invoice for sales and collections."
          actions={
            <div className="text-xs text-muted-foreground">
              Actions are at the bottom
            </div>
          }
        />

        {/* alerts */}
        <div className="mb-4 grid gap-3">
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
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Customer + Dates */}
            <div className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Customer</div>
                <Button
                  variant="outline"
                  type="button"
                  className="rounded-full border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
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
                      onChange={(e) =>
                        setForm((f) => ({ ...f, partyId: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
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

                <label className="space-y-1 text-sm sm:col-span-2">
                  <BsDateInput
                    label="Invoice Date"
                    valueBs={form.date.bs}
                    valueAd={form.date.ad}
                    onChange={(next) => setForm((f) => ({ ...f, date: next }))}
                  />
                </label>

                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Reference No.</span>
                  <Input
                    value={form.referenceNo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, referenceNo: e.target.value }))
                    }
                    placeholder="Enter reference (optional)"
                  />
                </label>

                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Receivable Account</span>
                  <select
                    value={form.receivableAccountId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        receivableAccountId: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
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

            {/* Items */}
            <div className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Items</div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLine}
                  className="rounded-full px-4 bg-white/70"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add item
                </Button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/40">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-muted-foreground">
                        Item
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">
                        Rate
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground" />
                    </tr>
                  </thead>

                  <tbody>
                    {lines.map((line, idx) => {
                      const qty = Number(line.qty || 0);
                      const rate = Number(line.rate || 0);
                      const amt = qty * rate;

                      return (
                        <tr
                          key={idx}
                          className="border-t border-slate-200/70 dark:border-slate-700/70"
                        >
                          <td className="px-3 py-2">
                            <select
                              value={line.itemId}
                              onChange={(e) =>
                                updateLine(idx, { itemId: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
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
                              onChange={(e) =>
                                updateLine(idx, { qty: e.target.value })
                              }
                              placeholder="Qty"
                            />
                          </td>

                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.rate}
                              onChange={(e) =>
                                updateLine(idx, { rate: e.target.value })
                              }
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
                                lines.length === 1 &&
                                  "pointer-events-none opacity-50"
                              )}
                              title="Remove line"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="border-t bg-slate-100/60 dark:bg-slate-800/40">
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

            {/* Memo */}
            <div className="rounded-3xl border bg-white/90 p-6 shadow-sm space-y-5 dark:bg-slate-900/80">
              <div className="text-sm font-semibold">Memo</div>
              <Input
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="Goods and services provided"
              />
            </div>
          </div>

          {/* Right column */}
          <aside className="rounded-3xl border bg-white/90 p-6 shadow-sm space-y-5 dark:bg-slate-900/80">
            <div className="text-sm font-semibold">Summary</div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <MoneyText value={subtotal} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <MoneyText value={discount} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <MoneyText value={taxTotal} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-200/70 to-slate-100/40 px-3 py-2 font-semibold dark:from-slate-800/60 dark:to-slate-700/30">
                <span>Total</span>
                <MoneyText value={total} />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-xs text-muted-foreground">Invoice Date</div>
              <div className="flex items-baseline justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-sm font-semibold">{form.date.bs || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  ({form.date.ad || "—"})
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-xs text-muted-foreground">Additional notes</div>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
              />
            </div>
          </aside>
        </div>

        {/* Bottom actions (Save + Send only) */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            type="button"
            onClick={onSave}
            disabled={loading || sending}
            className="rounded-full px-6 bg-white/70"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save"}
          </Button>

          <Button
            type="button"
            onClick={onSend}
            disabled={loading || sending}
            className="rounded-full px-6 bg-slate-800 text-white hover:bg-slate-900"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
