"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import DualDateInput from "@/components/app/dual-date-input";
import { createInvoiceDraft } from "@/lib/api/invoices";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { getStockReport, type StockReportRow } from "@/lib/api/inventory";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Search,
  ChevronDown,
  Check,
  Eye,
  Printer,
  ChevronRight,
} from "lucide-react";
import { toBs } from "@/lib/dates/bs";

type Line = {
  itemId: string;
  qty: string;
  rate: string;
  description?: string;
};

type BillSundryRow = {
  id: string;
  name: string; // e.g. VAT, Discount
  type: "add" | "less";
  ratePct: string; // percent
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
      const isInsideMain = el.contains(target);
      const isInsideExtra = extraRefs.some((r) => r.current?.contains(target));
      if (!isInsideMain && !isInsideExtra) onOutside();
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
  onEnterNext?: () => void;
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
    onEnterNext,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<{ x: number; y: number } | null>(null);
  const setButtonRef = (node: HTMLButtonElement | null) => {
    buttonRef.current = node;
    if (!props.buttonRef) return;
    if (typeof props.buttonRef === "function") {
      props.buttonRef(node);
    } else {
      (props.buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    }
  };

  const outsideRefs = React.useMemo(() => [menuRef], []);
  const wrapRef = useOutsideClick<HTMLDivElement>(() => setOpen(false), outsideRefs);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});

  const focusNext = () => {
    if (onEnterNext) onEnterNext();
  };

  const selected = React.useMemo(
    () => options.find((o) => o.id === valueId),
    [options, valueId]
  );

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
    const updatePosition = () => {
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
    updatePosition();
    scrollRef.current = { x: window.scrollX, y: window.scrollY };
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      if (scrollRef.current) window.scrollTo(scrollRef.current.x, scrollRef.current.y);
    });
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className={cn("relative z-20 space-y-1", className)} ref={wrapRef}>
      {label ? <div className="text-xs text-muted-foreground">{label}</div> : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            // If closed, treat Enter as "next"
            if (!open) focusNext();
          }
        }}
        ref={setButtonRef}
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
                        focusNext();
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
                          focusNext();
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
  // iso: yyyy-mm-dd
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

  // Invoice header-like values (for UI)
  const [invoiceNo] = React.useState("1234/56789");

  const [form, setForm] = React.useState({
    partyId: "",
    receivableAccountId: "",
    invoiceDate: { bs: "", ad: "" },
    dueDate: { bs: "", ad: "" },

    referenceNo: "",
    paymentMethod: "bank_transfer" as
      | "cash"
      | "bank_transfer"
      | "cheque"
      | "online"
      | "credit",

    // Bank to show on invoice (display only)
    paymentDisplayAccountId: "",

    notes: "",
    termsOverrideEnabled: false,
    termsText: "",
  });

  const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "1", rate: "" }]);

  const [billSundries, setBillSundries] = React.useState<BillSundryRow[]>([
    { id: "vat", name: "VAT", type: "add", ratePct: "13" },
  ]);

  const [showTerms, setShowTerms] = React.useState(false);

  const customerSelectNextRef = React.useRef<HTMLInputElement | null>(null);
  const firstItemSelectRef = React.useRef<HTMLButtonElement | null>(null);

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

    const dueAd = isoAddDays(ad, 14); // default 14 days (adjust if you prefer Net 30)
    const dueBs = toBs(dueAd);

    setForm((f) => ({
      ...f,
      invoiceDate: { bs, ad },
      dueDate: { bs: dueBs, ad: dueAd },
    }));
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

  const billSundryComputed = React.useMemo(() => {
    const rows = billSundries.map((r) => {
      const pct = Number(r.ratePct || 0);
      const amount = (subtotal * pct) / 100;
      return { ...r, pct, amount };
    });
    const addTotal = rows.filter((r) => r.type === "add").reduce((s, r) => s + r.amount, 0);
    const lessTotal = rows.filter((r) => r.type === "less").reduce((s, r) => s + r.amount, 0);
    return { rows, addTotal, lessTotal, net: addTotal - lessTotal };
  }, [billSundries, subtotal]);

  const total = subtotal + billSundryComputed.net;

  const addSundry = () => {
    setBillSundries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "Sundry",
        type: "add",
        ratePct: "0",
      },
    ]);
  };

  const updateSundry = (id: string, patch: Partial<BillSundryRow>) => {
    setBillSundries((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeSundry = (id: string) => {
    setBillSundries((prev) => prev.filter((r) => r.id !== id));
  };

  const buildPayload = () => {
    if (!form.partyId || !form.receivableAccountId) {
      throw new Error("Customer and receivable account are required.");
    }

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
      type: "sales" as const,
      partyId: form.partyId,

      // invoice date
      date: form.invoiceDate.ad || undefined,
      dateBs: form.invoiceDate.bs || undefined,

      // NOTE: your InvoiceDraftInput supports dueDate/dueDateBs in the OpenAPI you shared earlier.
      // If your actual backend currently rejects it, remove these two lines.
      dueDate: form.dueDate.ad || undefined,
      dueDateBs: form.dueDate.bs || undefined,

      receivableAccountId: form.receivableAccountId,
      items: payloadItems,
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

  const onPreview = () => {
    setSuccess("Preview: wire to /invoices/preview or PDF preview endpoint.");
  };

  const onPrint = () => {
    setSuccess("Print: wire to PDF generation then open printable view.");
  };

  if (!mounted) return <div className="min-h-screen" />;

  // Bank accounts to show on invoice: filter assets that look like bank/cash (adjust later)
  const bankDisplayAccounts = accounts.filter((a) => {
    const n = (a.name ?? "").toLowerCase();
    return n.includes("bank") || n.includes("cash");
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-xl shadow-slate-200/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20">
        <PageHeader title="New Sales Invoice" description="Draft invoice for sales and collections." />

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

        {/* Top invoice strip (matches your image) */}
        <div className="mb-5 flex flex-col gap-4 rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.22em] text-muted-foreground">INVOICE NO:</div>
            <div className="text-2xl font-semibold tracking-tight">{invoiceNo}</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:gap-10">
            <div className="space-y-2">
              <div className="text-xs tracking-[0.22em] text-muted-foreground text-right lg:text-left">
                INVOICE DATE:
              </div>
              <div className="text-sm font-semibold text-right lg:text-left">
                {form.invoiceDate.ad || "—"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs tracking-[0.22em] text-muted-foreground text-right lg:text-left">
                DUE DATE:
              </div>
              <div className="text-sm font-semibold text-right lg:text-left">
                {form.dueDate.ad || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Main details (full-width like your image) */}
        <section className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Reference */}
            <label className="space-y-1 text-sm lg:col-span-4">
              <span className="text-xs text-muted-foreground">Reference No.</span>
              <Input
                ref={customerSelectNextRef}
                value={form.referenceNo}
                onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                placeholder="Enter reference (optional)"
              />
            </label>

            {/* Payment method just below reference (as you asked, but in same row on desktop) */}
            <label className="space-y-1 text-sm lg:col-span-4">
              <span className="text-xs text-muted-foreground">Payment method</span>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentMethod: e.target.value as any }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online Wallet / Gateway</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit (Pay later)</option>
              </select>
            </label>

            {/* Dates */}
            <div className="lg:col-span-4 grid gap-4 sm:grid-cols-2">
              <DualDateInput
                label="Invoice Date"
                value={form.invoiceDate}
                onChange={(next) => setForm((f) => ({ ...f, invoiceDate: next }))}
              />
              <DualDateInput
                label="Due Date"
                value={form.dueDate}
                onChange={(next) => setForm((f) => ({ ...f, dueDate: next }))}
              />
            </div>

            {/* Customer */}
            <div className="lg:col-span-8">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Customer Name</div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Customer
                </Button>
              </div>

              <SearchableSelect<PartyRecord>
                placeholder="Search customer…"
                valueId={form.partyId}
                onChange={(id) => setForm((f) => ({ ...f, partyId: id }))}
                options={parties}
                getLabel={(p) => p.name}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Receivable account (keep but can be moved to Advanced later) */}
            <label className="space-y-1 text-sm lg:col-span-4">
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

        {/* Items Details */}
        <section className="mt-6 rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Items Details</div>
            <Button type="button" variant="outline" onClick={addLine} className="rounded-full px-4">
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
          </div>

          <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/40">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100/80 dark:bg-slate-800/60">
                <tr>
                  {/* Resize the item column here (matches your request) */}
                  <th className="w-[560px] min-w-[520px] px-3 py-2 text-center text-xs text-muted-foreground">
                    Particulars
                  </th>
                  <th className="w-[120px] px-3 py-2 text-left text-xs text-muted-foreground">Qty</th>
                  <th className="w-[140px] px-3 py-2 text-left text-xs text-muted-foreground">Rate</th>
                  <th className="w-[160px] px-3 py-2 text-right text-xs text-muted-foreground">
                    Amount
                  </th>
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
                      <td className="w-[560px] min-w-[520px] px-3 py-2">
                        <SearchableSelect<StockReportRow>
                          placeholder="Search item…"
                          valueId={line.itemId}
                          onChange={(id) => updateLine(idx, { itemId: id })}
                          options={items}
                          getLabel={(it) => {
                            const code = (it as any).hsCode ? ` (${(it as any).hsCode})` : "";
                            return `${(it as any).name ?? "Item"}${code}`;
                          }}
                          leftIcon={<Search className="h-4 w-4" />}
                          buttonClassName="py-2"
                          emptyText="No items found"
                          buttonRef={idx === 0 ? firstItemSelectRef : undefined}
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

          {/* Bill Sundry (like your image) */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold tracking-[0.18em] text-slate-700 dark:text-slate-200">
                BILL SUNDRY
              </div>
              <Button type="button" variant="outline" onClick={addSundry} className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100/70 dark:bg-slate-800/50">
                  <tr>
                    <th className="w-[70px] px-3 py-2 text-left text-xs text-muted-foreground">
                      S.N.
                    </th>
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground">Bill Sundry</th>
                    <th className="w-[140px] px-3 py-2 text-right text-xs text-muted-foreground">@</th>
                    <th className="w-[190px] px-3 py-2 text-right text-xs text-muted-foreground">
                      Amount (Rs.)
                    </th>
                    <th className="w-[60px] px-3 py-2 text-right text-xs text-muted-foreground" />
                  </tr>
                </thead>
                <tbody>
                  {billSundryComputed.rows.map((r, idx) => (
                    <tr key={r.id} className="border-t border-slate-200/70 dark:border-slate-700/70">
                      <td className="px-3 py-2 text-sm text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            value={r.name}
                            onChange={(e) => updateSundry(r.id, { name: e.target.value })}
                            className="sm:max-w-[260px]"
                          />
                          <select
                            value={r.type}
                            onChange={(e) => updateSundry(r.id, { type: e.target.value as any })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:max-w-[160px]"
                          >
                            <option value="add">Add</option>
                            <option value="less">Less</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            value={r.ratePct}
                            onChange={(e) => updateSundry(r.id, { ratePct: e.target.value })}
                            className="w-[90px] text-right"
                            inputMode="decimal"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        <MoneyText value={r.amount} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeSundry(r.id)}
                          className={cn(
                            "inline-flex items-center justify-center rounded-md border px-2 py-2 text-xs text-red-600 hover:bg-red-50",
                            billSundries.length === 1 && "pointer-events-none opacity-50"
                          )}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  <tr className="border-t bg-slate-100/60 dark:bg-slate-800/40">
                    <td className="px-3 py-2" colSpan={3}>
                      <div className="text-right font-medium">Net Sundry</div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      <MoneyText value={billSundryComputed.net} />
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Details (bank to show on invoice) */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">
                Payment Details <span className="text-xs text-muted-foreground">(shown on invoice)</span>
              </div>
              <div className="text-xs text-muted-foreground">Optional</div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Select bank account</span>
                <select
                  value={form.paymentDisplayAccountId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentDisplayAccountId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">Using company default</option>
                  {bankDisplayAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code ? `${a.code} - ${a.name}` : a.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="text-xs text-muted-foreground">Shown on PDF</div>
                <div className="mt-1 font-medium">
                  {form.paymentDisplayAccountId
                    ? bankDisplayAccounts.find((x) => x.id === form.paymentDisplayAccountId)?.name ??
                      "—"
                    : "Company default bank details"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">A/C Name, Number, Branch (from settings)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Terms & Conditions + Summary + Actions (bottom like your image) */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Terms */}
          <section className="lg:col-span-12 rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
            <button
              type="button"
              onClick={() => setShowTerms((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-900/40"
            >
              <div className="flex items-center gap-3">
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    showTerms && "rotate-90"
                  )}
                />
                <div>
                  <div className="text-sm font-semibold">Terms &amp; Conditions</div>
                  <div className="text-xs text-muted-foreground">Using company default</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Optional</div>
            </button>

            {showTerms ? (
              <div className="mt-4 grid gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.termsOverrideEnabled}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, termsOverrideEnabled: e.target.checked }))
                    }
                  />
                  <span>Override for this invoice</span>
                </label>

                <textarea
                  value={form.termsText}
                  onChange={(e) => setForm((f) => ({ ...f, termsText: e.target.value }))}
                  placeholder={
                    form.termsOverrideEnabled
                      ? "Enter terms & conditions to print on this invoice…"
                      : "Company default will be used in PDF…"
                  }
                  disabled={!form.termsOverrideEnabled}
                  className={cn(
                    "min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950",
                    !form.termsOverrideEnabled && "opacity-70"
                  )}
                />
              </div>
            ) : null}
          </section>

          {/* Summary block (bottom-left) */}
          <section className="lg:col-span-5 rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
            <div className="mb-3 text-sm font-semibold">Summary</div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <MoneyText value={subtotal} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bill Sundry</span>
                  <MoneyText value={billSundryComputed.net} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-200/70 to-slate-100/40 px-3 py-2 font-semibold dark:from-slate-800/60 dark:to-slate-700/30">
                <span>Total</span>
                <MoneyText value={total} />
              </div>
            </div>
          </section>

          {/* Notes + actions (bottom-right) */}
          <section className="lg:col-span-7 rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Additional notes</div>
              <div className="text-xs text-muted-foreground">
                BS: <span className="font-medium text-foreground">{form.invoiceDate.bs || "—"}</span>{" "}
                <span className="text-muted-foreground">({form.invoiceDate.ad || "—"})</span>
              </div>
            </div>

            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Additional notes..."
            />

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onPreview}
                className="rounded-full px-5 bg-white/70"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onPrint}
                className="rounded-full px-5 bg-white/70"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onSave}
                disabled={loading || sending}
                className="rounded-full px-5 bg-white/70"
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
          </section>
        </div>
      </div>
    </div>
  );
}
