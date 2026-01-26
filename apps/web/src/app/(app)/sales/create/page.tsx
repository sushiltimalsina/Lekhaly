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
import { Plus, Trash2, Save, Send, Search, ChevronDown, Check } from "lucide-react";
import { toBs } from "@/lib/dates/bs";

type Line = {
  itemId: string;
  qty: string;
  rate: string;
  description?: string;
};

function useOutsideClick<T extends HTMLElement>(onOutside: () => void) {
  const ref = React.useRef<T | null>(null);

  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onOutside]);

  return ref;
}

function SearchableSelect<T extends { id: string; name?: string }>(props: {
  label?: string;
  placeholder?: string;
  valueId: string;
  onChange: (id: string) => void;
  options: T[];
  getLabel?: (opt: T) => string;
  leftIcon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  emptyText?: string;
}) {
  const {
    label,
    placeholder = "Select…",
    valueId,
    onChange,
    options,
    getLabel,
    leftIcon,
    className,
    buttonClassName,
    emptyText = "No results",
  } = props;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const wrapRef = useOutsideClick<HTMLDivElement>(() => setOpen(false));

  const selected = React.useMemo(() => options.find((o) => o.id === valueId), [options, valueId]);

  const selectedLabel = selected
    ? (getLabel ? getLabel(selected) : selected.name ?? selected.id)
    : "";

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const labelText = (getLabel ? getLabel(o) : o.name ?? o.id).toLowerCase();
      return labelText.includes(q);
    });
  }, [options, query, getLabel]);

  return (
    <div className={cn("relative z-20 space-y-1", className)} ref={wrapRef}>
      {label ? <div className="text-xs text-muted-foreground">{label}</div> : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/40",
          buttonClassName
        )}
      >
        {leftIcon ? <span className="text-muted-foreground">{leftIcon}</span> : null}
        <span className={cn("min-w-0 flex-1 truncate", !selectedLabel && "text-muted-foreground")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-auto p-1">
            {filtered.length ? (
              filtered.map((o) => {
                const labelText = getLabel ? getLabel(o) : o.name ?? o.id;
                const active = o.id === valueId;

                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40",
                      active && "bg-primary/10"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{labelText}</span>
                    {active ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-sm text-muted-foreground">{emptyText}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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

  const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "1", rate: "" }]);

  const formatError = (e: any) => {
    const issues = e?.details?.issues;
    if (Array.isArray(issues) && issues.length) {
      return issues
        .map((issue) => {
          const path = Array.isArray(issue?.path) ? issue.path.join(".") : "";
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join("\n");
    }
    return e?.message ?? "Something went wrong.";
  };

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const now = new Date();
    const ad = now.toISOString().slice(0, 10);
    const bs = toBs(ad);
    setForm((f) => ({ ...f, date: { bs, ad } }));
  }, []);

  React.useEffect(() => {
    let alive = true;

    const normalizeList = <T,>(input: unknown): T[] => {
      if (Array.isArray(input)) return input as T[];
      const obj = input as { items?: T[]; data?: T[] } | null;
      return obj?.items ?? obj?.data ?? [];
    };

    Promise.all([
      listParties({ type: "customer", take: 200 }),
      listAccounts({ type: "asset", take: 200 }),
      getStockReport(),
    ])
      .then(([p, a, i]) => {
        if (!alive) return;
        setParties(normalizeList<PartyRecord>(p));
        setAccounts(normalizeList<AccountRecord>(a));
        setItems(normalizeList<StockReportRow>(i));
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(formatError(e));
      });

    return () => {
      alive = false;
    };
  }, []);

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { itemId: "", qty: "1", rate: "" }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = React.useMemo(() => {
    return lines.reduce((sum, l) => {
      const qty = Number(l.qty || 0);
      const rate = Number(l.rate || 0);
      return sum + qty * rate;
    }, 0);
  }, [lines]);

  const discount = 0;
  const taxTotal = 0;
  const total = subtotal - discount + taxTotal;

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
    };
  };

  const onSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res: any = await createInvoiceDraft(buildPayload());
      const id = res?.id ?? res?.invoiceId ?? res?.data?.id;
      setSuccess(id ? `Saved draft: ${id}` : "Saved draft.");
    } catch (e: any) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  };

  const onSend = async () => {
    setError(null);
    setSuccess(null);
    setSending(true);
    try {
      const res: any = await createInvoiceDraft(buildPayload());
      const id = res?.id ?? res?.invoiceId ?? res?.data?.id;
      setSuccess(id ? `Draft ready to send: ${id}` : "Draft ready to send.");
    } catch (e: any) {
      setError(formatError(e));
    } finally {
      setSending(false);
    }
  };

  if (!mounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-xl shadow-slate-200/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20">
        <PageHeader
          title="New Sales Invoice"
          description="Invoice details fill the page. Summary and actions are at the bottom."
        />

        {/* Alerts */}
        <div className="mb-4 grid gap-3">
          {error ? (
            <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700 whitespace-pre-line">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}
        </div>

        {/* FULL-WIDTH CONTENT */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Invoice details */}
          <div className="lg:col-span-12 space-y-6">
            {/* Customer + Invoice Details */}
            <section className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Invoice Details</div>
                <Button
                  variant="outline"
                  type="button"
                  className="rounded-full border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  New Customer
                </Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <SearchableSelect<PartyRecord>
                  label="Customer"
                  placeholder="Search customer…"
                  valueId={form.partyId}
                  onChange={(id) => setForm((f) => ({ ...f, partyId: id }))}
                  options={parties}
                  getLabel={(p) => p.name}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="lg:col-span-2"
                />

                <div className="lg:col-span-1">
                  <BsDateInput
                    label="Invoice Date"
                    valueBs={form.date.bs}
                    valueAd={form.date.ad}
                    onChange={(next) => setForm((f) => ({ ...f, date: next }))}
                  />
                </div>

                <label className="space-y-1 text-sm lg:col-span-1">
                  <span className="text-xs text-muted-foreground">Reference No.</span>
                  <Input
                    value={form.referenceNo}
                    onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                    placeholder="Enter reference (optional)"
                  />
                </label>

                <label className="space-y-1 text-sm lg:col-span-2">
                  <span className="text-xs text-muted-foreground">Receivable Account</span>
                  <select
                    value={form.receivableAccountId}
                    onChange={(e) => setForm((f) => ({ ...f, receivableAccountId: e.target.value }))}
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
            </section>

            {/* Items */}
            <section className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Items</div>
                <Button type="button" variant="outline" onClick={addLine} className="rounded-full px-4 bg-white/70">
                  <Plus className="mr-2 h-4 w-4" />
                  Add item
                </Button>
              </div>

              <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/40">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/60">
                    <tr>
                      {/* Resize Item column width here */}
                      <th className="w-[540px] min-w-[460px] px-3 py-2 text-left text-xs text-muted-foreground">
                        Item
                      </th>
                      <th className="w-[120px] px-3 py-2 text-right text-xs text-muted-foreground">Qty</th>
                      <th className="w-[140px] px-3 py-2 text-right text-xs text-muted-foreground">Rate</th>
                      <th className="w-[160px] px-3 py-2 text-right text-xs text-muted-foreground">Amount</th>
                      <th className="w-[60px] px-3 py-2 text-right text-xs text-muted-foreground" />
                    </tr>
                  </thead>

                  <tbody>
                    {lines.map((line, idx) => {
                      const qty = Number(line.qty || 0);
                      const rate = Number(line.rate || 0);
                      const amt = qty * rate;

                      return (
                        <tr key={idx} className="border-t border-slate-200/70 dark:border-slate-700/70">
                          {/* Resize Item column width here */}
                          <td className="w-[540px] min-w-[460px] px-3 py-2">
                            <SearchableSelect<StockReportRow>
                              placeholder="Search item…"
                              valueId={line.itemId}
                              onChange={(id) => updateLine(idx, { itemId: id })}
                              options={items}
                              getLabel={(it) => {
                                const code = it.hsCode ? ` (${it.hsCode})` : "";
                                return `${it.name}${code}`;
                              }}
                              leftIcon={<Search className="h-4 w-4" />}
                              buttonClassName="py-2"
                              emptyText="No items found"
                            />
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
                                lines.length === 1 && "pointer-events-none opacity-50"
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
            </section>

            {/* Memo */}
            <section className="rounded-3xl border bg-white/90 p-6 shadow-sm space-y-5 dark:bg-slate-900/80">
              <div className="text-sm font-semibold">Memo</div>
              <Input
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="Goods and services provided"
              />
            </section>

            {/* ✅ BOTTOM SUMMARY (NEW) */}
            <section className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Summary</div>
                <div className="text-xs text-muted-foreground">
                  BS: <span className="font-medium text-foreground">{form.date.bs || "—"}</span>{" "}
                  <span className="text-muted-foreground">({form.date.ad || "—"})</span>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-12">
                {/* totals */}
                <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
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

                {/* notes + actions */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="text-xs text-muted-foreground">Additional notes</div>
                    <Input
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
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
            </section>

            {/* bottom space for scroll comfort */}
            <div className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

