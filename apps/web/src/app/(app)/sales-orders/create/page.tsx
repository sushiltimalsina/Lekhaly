"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";

import { listParties, type PartyRecord } from "@/lib/api/parties";
import { getStockReport, type StockReportRow } from "@/lib/api/inventory";

// Replace with your actual SO API:
// import { createSalesOrderDraft } from "@/lib/api/sales-orders";

import {
  Plus,
  Trash2,
  Save,
  Send,
  Search,
  ChevronDown,
  Check,
  ChevronRight,
} from "lucide-react";

import { toBs } from "@/lib/dates/bs";

type Line = {
  itemId: string;
  qty: string;
  rate: string;
  description?: string;
};

function useOutsideClick<T extends HTMLElement>(
  onOutside: () => void,
  extraRefs: Array<React.RefObject<HTMLElement | null>> = []
) {
  const ref = React.useRef<T | null>(null);

  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (!target) return;

      const insideMain = el.contains(target);
      const insideExtra = extraRefs.some((r) => r.current?.contains(target));
      if (!insideMain && !insideExtra) onOutside();
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onOutside, extraRefs]);

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
  buttonRef?: React.Ref<HTMLButtonElement>;
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

  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const setButtonRef = (node: HTMLButtonElement | null) => {
    buttonRef.current = node;
    if (!props.buttonRef) return;
    if (typeof props.buttonRef === "function") props.buttonRef(node);
    else (props.buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  };

  const wrapRef = useOutsideClick<HTMLDivElement>(() => setOpen(false), [menuRef]);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});

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

  React.useEffect(() => {
    if (!open) return;

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 1000,
      });
    };

    update();
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  return (
    <div className={cn("relative space-y-1", className)} ref={wrapRef}>
      {label ? <div className="text-xs text-muted-foreground">{label}</div> : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        ref={setButtonRef}
        className={cn(
          "flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm hover:bg-slate-50",
          "dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/40",
          buttonClassName
        )}
      >
        {leftIcon ? <span className="text-muted-foreground">{leftIcon}</span> : null}
        <span className={cn("min-w-0 flex-1 truncate", !selectedLabel && "text-muted-foreground")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20"
            >
              <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setOpen(false);
                        setQuery("");
                        buttonRef.current?.focus();
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const first = filtered[0];
                        if (first) onChange(first.id);
                        setOpen(false);
                        setQuery("");
                        buttonRef.current?.focus();
                      }
                    }}
                    placeholder="Type to search…"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950"
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
                          buttonRef.current?.focus();
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
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function isoAddDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function SalesOrderCreatePage() {
  const [mounted, setMounted] = React.useState(false);

  const [parties, setParties] = React.useState<PartyRecord[]>([]);
  const [items, setItems] = React.useState<StockReportRow[]>([]);

  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [showTerms, setShowTerms] = React.useState(false);

  const [form, setForm] = React.useState({
    partyId: "",
    orderDate: { bs: "", ad: "" },
    deliveryDate: { bs: "", ad: "" },
    referenceNo: "",
    paymentMethod: "bank_transfer" as "cash" | "bank_transfer" | "cheque" | "online" | "credit",
    notes: "",
    termsOverrideEnabled: false,
    termsText: "",
  });

  const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "1", rate: "" }]);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const now = new Date();
    const ad = now.toISOString().slice(0, 10);
    const bs = toBs(ad);

    const delAd = isoAddDays(ad, 7);
    const delBs = toBs(delAd);

    setForm((f) => ({ ...f, orderDate: { bs, ad }, deliveryDate: { bs: delBs, ad: delAd } }));
  }, []);

  React.useEffect(() => {
    let alive = true;

    const normalizeList = <T,>(input: unknown): T[] => {
      if (Array.isArray(input)) return input as T[];
      const obj = input as { items?: T[]; data?: T[] } | null;
      return obj?.items ?? obj?.data ?? [];
    };

    Promise.all([listParties({ type: "customer", take: 200 }), getStockReport()])
      .then(([p, i]) => {
        if (!alive) return;
        setParties(normalizeList<PartyRecord>(p));
        setItems(normalizeList<StockReportRow>(i));
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(e?.message ?? "Failed to load dropdown data.");
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
    return lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.rate || 0), 0);
  }, [lines]);

  const buildPayload = () => {
    if (!form.partyId) throw new Error("Customer is required.");

    const payloadItems = lines
      .filter((l) => l.itemId && Number(l.qty) > 0)
      .map((l) => ({
        itemId: l.itemId,
        qty: Number(l.qty),
        rate: Number(l.rate || 0),
        description: l.description || undefined,
      }));

    if (!payloadItems.length) throw new Error("Add at least one item line.");

    return {
      type: "sales_order" as const,
      partyId: form.partyId,
      orderDate: form.orderDate.ad,
      orderDateBs: form.orderDate.bs,
      deliveryDate: form.deliveryDate.ad,
      deliveryDateBs: form.deliveryDate.bs,
      referenceNo: form.referenceNo || undefined,
      paymentMethod: form.paymentMethod,
      notes: form.notes || undefined,
      terms:
        form.termsOverrideEnabled && form.termsText.trim()
          ? form.termsText.trim()
          : undefined,
      items: payloadItems,
    };
  };

  // Replace with real API call
  async function fakeCreateSalesOrderDraft(payload: any) {
    await new Promise((r) => setTimeout(r, 400));
    return { id: "SO-0001", payload };
  }

  const onSaveDraft = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fakeCreateSalesOrderDraft(buildPayload());
      setSuccess(`Saved draft: ${res?.id ?? "OK"}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save sales order.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fakeCreateSalesOrderDraft(buildPayload());
      setSuccess(`Submitted: ${res?.id ?? "OK"}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit sales order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <PageHeader title="New Sales Order" description="Create an order (does not post to ledger)." />

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

        {/* Top strip: left fields + dates pinned right (like your invoice layout) */}
        <section className="relative mb-6">
          <div className="absolute right-0 top-0 hidden w-[260px] flex-col gap-3 lg:flex">
            <DualDateInput
              label="Order Date"
              value={form.orderDate}
              onChange={(next) => setForm((f) => ({ ...f, orderDate: next }))}
            />
            <DualDateInput
              label="Delivery Date"
              value={form.deliveryDate}
              onChange={(next) => setForm((f) => ({ ...f, deliveryDate: next }))}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-12 lg:pr-[300px]">
            <div className="lg:col-span-5 space-y-3">
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Sales Order No.</span>
                <Input placeholder="System generated" className="h-11 rounded-2xl bg-slate-50/60" disabled />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Reference No.</span>
                <Input
                  value={form.referenceNo}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                  placeholder="Enter reference (optional)"
                  className="h-11 rounded-2xl bg-slate-50/60"
                />
              </label>
            </div>

            <div className="lg:col-span-7 flex items-end lg:justify-center">
              <div className="w-full max-w-[620px]">
                <div className="text-xs text-muted-foreground">Payment method</div>
                <div className="mt-2">
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as any }))}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online Wallet / Gateway</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                    <option value="credit">Credit (Pay later)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile dates */}
            <div className="grid gap-3 lg:hidden sm:grid-cols-2">
              <DualDateInput
                label="Order Date"
                value={form.orderDate}
                onChange={(next) => setForm((f) => ({ ...f, orderDate: next }))}
              />
              <DualDateInput
                label="Delivery Date"
                value={form.deliveryDate}
                onChange={(next) => setForm((f) => ({ ...f, deliveryDate: next }))}
              />
            </div>
          </div>
        </section>

        {/* Customer block */}
        <section className="mb-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="text-[22px] font-semibold tracking-[0.16em] text-slate-900 dark:text-slate-50">
            Customer
          </div>

          <div className="mt-4">
            <div className="relative">
              <SearchableSelect<PartyRecord>
                placeholder="Search customer…"
                valueId={form.partyId}
                onChange={(id) => setForm((f) => ({ ...f, partyId: id }))}
                options={parties}
                getLabel={(p) => p.name}
                leftIcon={<Search className="h-4 w-4" />}
                buttonClassName="h-11 rounded-2xl bg-white pr-[130px]"
              />

              <Button
                type="button"
                variant="outline"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 rounded-full px-4 text-xs"
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                New Customer
              </Button>
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Items</div>

            <Button
              type="button"
              onClick={addLine}
              className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/30">
            <div className="overflow-x-auto px-0 pb-4 pt-2">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100/70 dark:bg-slate-900/40">
                  <tr>
                    <th className="w-[520px] min-w-[460px] px-4 py-3 text-left text-xs text-muted-foreground">
                      Particulars
                    </th>
                    <th className="w-[140px] px-4 py-3 text-left text-xs text-muted-foreground">
                      Qty
                    </th>
                    <th className="w-[180px] px-4 py-3 text-left text-xs text-muted-foreground">
                      Rate
                    </th>
                    <th className="w-[180px] px-4 py-3 text-right text-xs text-muted-foreground">
                      Amount
                    </th>
                    <th className="w-[70px] px-4 py-3 text-right text-xs text-muted-foreground" />
                  </tr>
                </thead>

                <tbody>
                  {lines.map((line, idx) => {
                    const qty = Number(line.qty || 0);
                    const rate = Number(line.rate || 0);
                    const amt = qty * rate;

                    return (
                      <tr key={idx} className="border-t border-slate-200/70 dark:border-slate-800/60">
                        <td className="px-4 py-3">
                          <SearchableSelect<StockReportRow>
                            placeholder="Search item…"
                            valueId={line.itemId}
                            onChange={(id) => updateLine(idx, { itemId: id })}
                            options={items}
                            getLabel={(it) => {
                              const anyIt = it as any;
                              const code = anyIt?.hsCode ? ` (${anyIt.hsCode})` : "";
                              return `${anyIt?.name ?? "Item"}${code}`;
                            }}
                            leftIcon={<Search className="h-4 w-4" />}
                            buttonClassName="h-11 rounded-2xl bg-white"
                            emptyText="No items found"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.qty}
                            onChange={(e) => updateLine(idx, { qty: e.target.value })}
                            className="h-11 rounded-2xl bg-white text-right"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.rate}
                            onChange={(e) => updateLine(idx, { rate: e.target.value })}
                            className="h-11 rounded-2xl bg-white text-right"
                            placeholder="Rate"
                          />
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">
                          <MoneyText value={amt} />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className={cn(
                              "inline-flex h-10 w-10 items-center justify-center rounded-xl border text-red-600 hover:bg-red-50",
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

                  <tr className="border-t bg-slate-100/60 dark:bg-slate-900/40">
                    <td className="px-4 py-3 text-right font-semibold" colSpan={3}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <MoneyText value={subtotal} />
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Terms (collapsed) */}
        <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setShowTerms((v) => !v)}
            className="flex w-full items-center gap-3"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showTerms && "rotate-90"
              )}
            />
            <div className="text-sm font-semibold">Terms &amp; Conditions</div>
          </button>

          <div className="mt-2 text-sm text-muted-foreground">Using company default</div>

          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="mt-3 text-sm font-medium text-slate-700 hover:underline dark:text-slate-200"
          >
            + Add terms &amp; conditions
          </button>

          {showTerms ? (
            <div className="mt-4 grid gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.termsOverrideEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, termsOverrideEnabled: e.target.checked }))}
                />
                <span>Override for this order</span>
              </label>

              <textarea
                value={form.termsText}
                onChange={(e) => setForm((f) => ({ ...f, termsText: e.target.value }))}
                disabled={!form.termsOverrideEnabled}
                placeholder={
                  form.termsOverrideEnabled
                    ? "Enter terms & conditions to print on this order…"
                    : "Company default will be used…"
                }
                className={cn(
                  "min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950",
                  !form.termsOverrideEnabled && "opacity-70"
                )}
              />
            </div>
          ) : null}
        </section>

        {/* Bottom: summary + notes + actions */}
        <section className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 text-sm font-semibold">Summary</div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/30">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <div className="font-medium">
                    <MoneyText value={subtotal} />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950">
                <div className="text-sm font-semibold">Total</div>
                <div className="text-sm font-semibold">
                  <MoneyText value={subtotal} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Additional notes
              </div>
              <div className="text-xs text-muted-foreground">
                BS: <span className="font-medium text-foreground">{form.orderDate.bs || "—"}</span>{" "}
                <span className="text-muted-foreground">({form.orderDate.ad || "—"})</span>
              </div>
            </div>

            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Additional notes..."
              className="h-11 rounded-2xl bg-slate-50/60"
            />

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSaveDraft}
                disabled={loading || submitting}
                className="rounded-full px-6"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Draft"}
              </Button>

              <Button
                type="button"
                onClick={onSubmit}
                disabled={loading || submitting}
                className="rounded-full bg-indigo-600 px-7 text-white hover:bg-indigo-700"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
