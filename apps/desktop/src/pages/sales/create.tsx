"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";

import { createInvoiceDraft, postInvoice } from "@/lib/api/invoices";
import { isOfflineQueuedResponse } from "@/lib/api/client";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listItems, type ItemRecord } from "@/lib/api/items";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddCustomerDialog from "@/components/app/add-customer-dialog";
import { listBillSundries, type BillSundryRecord } from "@/lib/api/bill-sundries";
import { listPaymentMethods } from "@/lib/api/payment-methods";
import { listSaleTypes } from "@/lib/api/sale-types";
import { getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listWarehouses, type Warehouse } from "@/lib/api/warehouses";
import AddPaymentMethodDialog from "@/components/app/add-payment-method-dialog";
import AddSaleTypeDialog from "@/components/app/add-sale-type-dialog";
import { useUiState } from "@/lib/store/ui";
import { useExcelPaste } from "@/hooks/use-excel-paste";

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
  FileText,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toBs } from "@/lib/dates/bs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getInvoice, updateInvoiceDraft } from "@/lib/api/invoices";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";

type Line = {
  itemId: string;
  qty: string;
  rate: string;
  unit?: string;
  description?: string;
  warehouseId?: string;
  binId?: string;
  batchNo?: string;
  lotNo?: string;
  expiryDate?: string;
  expiryDateBs?: string;
  serialText?: string;
};
type BillSundryRow = { id: string; sundryId?: string; name: string; type: "add" | "less"; ratePct: string; manualAmount?: string; isManual?: boolean };

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
  onChange: (id: string, opt?: T) => void;
  options: T[];
  getLabel?: (opt: T) => string;
  getDetail?: (opt: T) => string | undefined;
  leftIcon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  emptyText?: string;
  onAdd?: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
  onEnterNext?: () => void;
  onKeyDownCustom?: (e: React.KeyboardEvent<any>) => void;
  fallbackLabel?: string;
  disabled?: boolean;
}) {
  const {
    label,
    placeholder = "Select�",
    valueId,
    onChange,
    options,
    getLabel,
    getDetail,
    leftIcon,
    className,
    buttonClassName,
    emptyText = "No items found",
    fallbackLabel,
    disabled,
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
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
    opacity: 0,
    pointerEvents: "none",
  });

  const selected = React.useMemo(() => options.find((o) => o.id === valueId), [options, valueId]);
  const selectedLabel = selected
    ? (getLabel ? getLabel(selected) : selected.name ?? selected.id)
    : (fallbackLabel || "");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const labelText = (getLabel ? getLabel(o) : o.name ?? o.id).toLowerCase();
      return labelText.includes(q);
    });
  }, [options, query, getLabel]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

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
        opacity: 1,
        pointerEvents: "auto",
      });
    };
    update();
    const timer = setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 40);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (open && listRef.current) {
      const container = listRef.current;
      const activeEl = container.children[activeIndex] as HTMLElement;
      if (activeEl) {
        // Use local scroll adjustment to avoid page jumping
        const containerRect = container.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        if (elRect.top < containerRect.top) {
          container.scrollTop -= (containerRect.top - elRect.top);
        } else if (elRect.bottom > containerRect.bottom) {
          container.scrollTop += (elRect.bottom - containerRect.bottom);
        }
      }
    }
  }, [activeIndex, open]);

  return (
    <div className={cn("relative space-y-1", className)} ref={wrapRef}>
      {label ? <div className="text-xs text-muted-foreground">{label}</div> : null}

      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (props.onKeyDownCustom) {
            props.onKeyDownCustom(e);
            if (e.defaultPrevented) return;
          }
          if (!disabled && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        disabled={disabled}
        ref={setButtonRef}
        className={cn(
          "flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm hover:bg-slate-50",
          "dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/40",
          disabled && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/20",
          buttonClassName
        )}
      >
        {leftIcon ? <span className="text-muted-foreground">{leftIcon}</span> : null}
        <span className={cn("min-w-0 flex-1 truncate", !selectedLabel && "text-muted-foreground")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground -ml-3" />
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
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
                    }
                    if (e.key === "Enter") {
                      if (props.onKeyDownCustom) {
                        props.onKeyDownCustom(e);
                        if (e.defaultPrevented) return;
                      }
                      e.preventDefault();
                      const item = filtered[activeIndex];
                      if (item) {
                        window.lekhalyUnsavedChanges?.markDirty();
                        onChange(item.id, item);
                        setOpen(false);
                        setQuery("");
                        setTimeout(() => {
                          if (props.onEnterNext) props.onEnterNext();
                          else buttonRef.current?.focus({ preventScroll: true });
                        }, 10);
                      }
                    }
                  }}
                  placeholder="Type to search…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            <div ref={listRef} className="max-h-64 overflow-auto p-1">
              {filtered.length ? (
                filtered.map((o, idx) => {
                  const labelText = getLabel ? getLabel(o) : o.name ?? o.id;
                  const detailText = getDetail ? getDetail(o) : undefined;
                  const isSelected = o.id === valueId;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onMouseMove={() => setActiveIndex(idx)}
                      onClick={() => {
                        window.lekhalyUnsavedChanges?.markDirty();
                        onChange(o.id, o);
                        setOpen(false);
                        setQuery("");
                        setTimeout(() => {
                          if (props.onEnterNext) props.onEnterNext();
                          else buttonRef.current?.focus({ preventScroll: true });
                        }, 10);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                        isActive ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                        isSelected && "text-emerald-600 font-medium"
                      )}
                    >
                      <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                        <span className="truncate">{labelText}</span>
                        {detailText ? (
                          <span className={cn("text-xs whitespace-nowrap", isSelected ? "text-emerald-600/80" : "text-muted-foreground")}>
                            {detailText}
                          </span>
                        ) : null}
                      </div>
                      {isSelected ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-3 text-center">
                  <div className="text-sm text-muted-foreground mb-3">{emptyText}</div>
                  {props.onAdd && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        props.onAdd?.();
                      }}
                      className="rounded-full h-8 bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add New
                    </Button>
                  )}
                </div>
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

export default function SalesCreatePage() {
  const [mounted, setMounted] = React.useState(false);

  const invoiceDateRef = React.useRef<HTMLInputElement>(null);
  const dueDateRef = React.useRef<HTMLInputElement>(null);
  const invoiceNoRef = React.useRef<HTMLInputElement>(null);
  const paymentMethodRef = React.useRef<HTMLButtonElement>(null);
  const salesTypeRef = React.useRef<HTMLButtonElement>(null);
  const memoRef = React.useRef<HTMLInputElement>(null);
  const referenceNoRef = React.useRef<HTMLInputElement>(null);
  const customerSelectRef = React.useRef<HTMLButtonElement>(null);
  const addLineButtonRef = React.useRef<HTMLButtonElement>(null);
  const addSundryButtonRef = React.useRef<HTMLButtonElement>(null);
  const [lineErrors, setLineErrors] = React.useState<Record<number, { qty?: string; rate?: string }>>({});
  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [activeLineIdx, setActiveLineIdx] = React.useState<number | null>(null);
  const [addCustomerOpen, setAddCustomerOpen] = React.useState(false);
  const [addPaymentMethodOpen, setAddPaymentMethodOpen] = React.useState(false);
  const [addSaleTypeOpen, setAddSaleTypeOpen] = React.useState(false);
  const [addSundryOpen, setAddSundryOpen] = React.useState(false);
  const [activeSundryIdx, setActiveSundryIdx] = React.useState<number | null>(null);

  // For item table navigation
  const rowRefs = React.useRef<{
    select: (HTMLButtonElement | null)[];
    qty: (HTMLInputElement | null)[];
    rate: (HTMLInputElement | null)[];
  }>({ select: [], qty: [], rate: [] });

  const sundryRefs = React.useRef<{
    select: (HTMLButtonElement | null)[];
    rate: (HTMLInputElement | null)[];
    amount: (HTMLInputElement | null)[];
  }>({ select: [], rate: [], amount: [] });

  const termsRef = React.useRef<HTMLTextAreaElement>(null);
  const notesRef = React.useRef<HTMLTextAreaElement>(null);

  const [parties, setParties] = React.useState<PartyRecord[]>([]);
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
  const [items, setItems] = React.useState<ItemRecord[]>([]);
  const [sundryOptions, setSundryOptions] = React.useState<BillSundryRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = React.useState<any[]>([]);
  const [saleTypes, setSaleTypes] = React.useState<any[]>([]);
  const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);

  const safeFocus = (el: HTMLElement | null) => {
    if (!el) return;
    el.focus({ preventScroll: true });
  };

  React.useEffect(() => {
    if (mounted) {
      setTimeout(() => safeFocus(invoiceDateRef.current), 100);
    }
  }, [mounted]);

  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    partyId: "",
    receivableAccountId: "",
    invoiceDate: { bs: "", ad: "" },
    dueDate: { bs: "", ad: "" },

    invoiceNoDisplay: "System generated",
    referenceNo: "",

    paymentMethod: "" as any,
    paymentMethodId: "",
    salesType: "vat_13" as any,
    saleTypeId: "",
    memo: "",
    notes: "",
    termsOverrideEnabled: false,
    termsText: "",
    partyName: "",
    invoiceNo: ""
  });

  const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "", rate: "" }]);

  const { handlePaste } = useExcelPaste<Line>({
    items,
    onPaste: (newLines) => {
      // If the first line is empty, replace it
      if (lines.length === 1 && !lines[0].itemId && !lines[0].qty) {
        setLines(newLines);
      } else {
        setLines([...lines, ...newLines]);
      }
      setSuccess(`Successfully pasted ${newLines.length} items from Excel.`);
    },
    mapRow: (cols, allItems) => {
      const query = cols[0]?.trim().toLowerCase();
      if (!query) return null;

      // Find item by name, sku, code, or hscode
      const item = allItems.find(it => 
        it.name?.toLowerCase() === query ||
        it.sku?.toLowerCase() === query ||
        it.code?.toLowerCase() === query ||
        it.hsCode?.toLowerCase() === query
      );

      if (!item) return null;

      return {
        itemId: item.id,
        qty: cols[1]?.trim() || "1",
        rate: cols[2]?.trim() || item.salesPrice?.toString() || "0",
        unit: item.unit || "",
        description: `${item.name}${item.sku ? ` [${item.sku}]` : ""}`
      };
    }
  });

  // Clean up refs when lines change
  React.useEffect(() => {
    rowRefs.current.select = rowRefs.current.select.slice(0, lines.length);
    rowRefs.current.qty = rowRefs.current.qty.slice(0, lines.length);
    rowRefs.current.rate = rowRefs.current.rate.slice(0, lines.length);
  }, [lines.length]);

  const [billSundries, setBillSundries] = React.useState<BillSundryRow[]>([
    { id: "discount", name: "Discount", type: "less", ratePct: "0" },
    { id: "vat", name: "VAT", type: "add", ratePct: "13" },
  ]);

  const [showTerms, setShowTerms] = React.useState(false);

  const defaultReceivable = React.useMemo(() => accounts[0]?.id ?? "", [accounts]);

  React.useEffect(() => setMounted(true), []);

  const ui = useUiState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditMode, setIsEditMode] = React.useState(true);
  const [invoiceStatus, setInvoiceStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (searchParams.get("id")) return;
    const now = new Date();
    const ad = now.toISOString().slice(0, 10);
    const bs = toBs(ad);
    const dueAd = isoAddDays(ad, 14);
    const dueBs = toBs(dueAd);

    setForm((f) => ({
      ...f,
      invoiceDate: { bs, ad },
      dueDate: { bs: dueBs, ad: dueAd },
    }));
  }, [searchParams]);

  React.useEffect(() => {
    if (!form.receivableAccountId && defaultReceivable) {
      setForm((f) => ({ ...f, receivableAccountId: defaultReceivable }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultReceivable]);

  React.useEffect(() => {
    let alive = true;

    const normalizeList = <T,>(input: unknown): T[] => {
      if (Array.isArray(input)) return input as T[];
      const obj = input as { items?: T[]; data?: T[] } | null;
      return obj?.items ?? obj?.data ?? [];
    };

    Promise.all([
      listParties({ type: "customer", take: 1000 }),
      listAccounts({ type: "asset", take: 1000 }),
      listItems({ take: 1000 }),
      listBillSundries({ take: 100 }),
      listPaymentMethods({ isActive: true }),
      listSaleTypes({ isActive: true }),
      getInventorySettings(),
      listWarehouses({ isActive: true })
    ])
      .then(([p, a, i, s, pm, st, inv, wh]) => {
        if (!alive) return;
        setParties(normalizeList<PartyRecord>(p));
        setAccounts(normalizeList<AccountRecord>(a));
        setItems(normalizeList<ItemRecord>(i));
        const opts = normalizeList<BillSundryRecord>(s);
        setSundryOptions(opts);
        setPaymentMethods(normalizeList<any>(pm));
        setSaleTypes(normalizeList<any>(st));
        setInventorySettings(inv as InventorySettings);
        setWarehouses(normalizeList<Warehouse>(wh));

        // Auto-link default sundries if they exist in the options
        setBillSundries(prev => prev.map(row => {
          if (row.sundryId) return row;
          const match = opts.find(o => o.name.toLowerCase() === row.name.toLowerCase());
          if (match) {
            return {
              ...row,
              sundryId: match.id,
              type: match.type as any,
              ratePct: row.id === "vat" ? "13" : (row.ratePct || match.rate?.toString() || "0")
            };
          }
          return row;
        }));

        // Load Edit ID if present
        const editId = searchParams.get("id");
        if (editId) {
          setIsEditMode(false);
          getInvoice(editId).then(inv => {
            setInvoiceStatus(inv.status || null);
            const parseDate = (d: any) => {
              if (!d) return "";
              if (typeof d === "string") return d.split("T")[0];
              if (d instanceof Date) return d.toISOString().split("T")[0];
              return String(d).split("T")[0];
            };

            setForm(f => ({
              ...f,
              partyId: inv.partyId || "",
              receivableAccountId: inv.receivableAccountId || "",
              invoiceDate: { ad: parseDate(inv.date), bs: inv.dateBs || "" },
              dueDate: { ad: parseDate(inv.dueDate), bs: inv.dueDateBs || "" },
              invoiceNoDisplay: inv.invoiceNo || "System generated",
              invoiceNo: inv.invoiceNo || "",
              referenceNo: inv.referenceNo || "",
              memo: inv.memo || "",
              notes: inv.additionalNote || "",
              partyName: inv.party?.name || "",
              salesType: inv.salesType || "vat_13"
            }));

            if (inv.items && inv.items.length > 0) {
              setLines(inv.items.map((it: any) => ({
                itemId: it.itemId,
                qty: String(Number(it.qty || 0)),
                rate: String(Number(it.rate || 0)),
                description: it.description || "",
                warehouseId: it.warehouseId || "",
                binId: it.binId || "",
                batchNo: it.batchNo || "",
                lotNo: it.lotNo || "",
                expiryDate: it.expiryDate ? String(it.expiryDate).split("T")[0] : "",
                expiryDateBs: it.expiryDateBs || "",
                serialText: Array.isArray(it.serialNumbers) ? it.serialNumbers.join("\n") : ""
              })));
            }

            if (inv.sundries && inv.sundries.length > 0) {
              setBillSundries(inv.sundries.map((sn: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                sundryId: sn.billSundryId,
                name: sn.name,
                type: sn.type,
                ratePct: String(sn.rate || "0"),
                manualAmount: String(sn.amount || "0"),
                isManual: true
              })));
            }
          }).catch(err => console.error("Failed to load invoice", err));
        }
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(e?.message ?? "Something went wrong.");
      });

    return () => {
      alive = false;
    };
  }, []);

  const itemsSubtotal = React.useMemo(() => {
    return lines.reduce((sum, l) => sum + Number(l.qty || 0) * Number(l.rate || 0), 0);
  }, [lines]);

  const billSundryComputed = React.useMemo(() => {
    const filteredRows = billSundries.filter(r => {
      if (r.id === "vat" && form.salesType !== "vat_13") return false;
      return true;
    });

    const rows = filteredRows.map((r) => {
      const pct = Number(r.ratePct || 0);
      const amount = (r.isManual || pct === 0) ? Number(r.manualAmount || 0) : (itemsSubtotal * pct) / 100;
      return { ...r, amount };
    });
    const add = rows.filter((r) => r.type === "add").reduce((s, r) => s + r.amount, 0);
    const less = rows.filter((r) => r.type === "less").reduce((s, r) => s + r.amount, 0);
    return { rows, net: add - less };
  }, [billSundries, itemsSubtotal, form.salesType]);

  const totalQty = React.useMemo(() => {
    return lines.reduce((sum, l) => sum + Number(l.qty || 0), 0);
  }, [lines]);

  const totalRate = React.useMemo(() => {
    return lines.reduce((sum, l) => sum + Number(l.rate || 0), 0);
  }, [lines]);

  const taxableAmount = React.useMemo(() => {
    return lines.reduce((sum, l) => {
      const item = items.find((it) => it.id === l.itemId);
      const isTaxable = !!item?.taxCodeId;
      return isTaxable ? sum + Number(l.qty || 0) * Number(l.rate || 0) : sum;
    }, 0);
  }, [lines, items]);

  const nonTaxableAmount = React.useMemo(() => {
    return lines.reduce((sum, l) => {
      const item = items.find((it) => it.id === l.itemId);
      const isTaxable = !!item?.taxCodeId;
      return !isTaxable ? sum + Number(l.qty || 0) * Number(l.rate || 0) : sum;
    }, 0);
  }, [lines, items]);

  const otherSundryTotal = React.useMemo(() => {
    return billSundryComputed.rows
      .filter((r) => r.id !== "vat" && r.id !== "discount")
      .reduce((sum, r) => sum + (r.type === "add" ? r.amount : -r.amount), 0);
  }, [billSundryComputed]);

  const total = itemsSubtotal + billSundryComputed.net;

  const updateLine = (idx: number, patch: Partial<Line>) => {
    if (patch.itemId) {
      const item = items.find(it => it.id === patch.itemId);
      if (item) {
        patch.unit = item.unit || "";
        patch.rate = item.salesPrice?.toString() || "";
        patch.warehouseId = inventorySettings?.defaultWarehouseId || "";
        patch.binId = "";
        patch.batchNo = "";
        patch.lotNo = "";
        patch.expiryDate = "";
        patch.expiryDateBs = "";
        patch.serialText = "";
      }
    }
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const [pendingFocusIndex, setPendingFocusIndex] = React.useState<number | null>(null);

  const addLine = () => {
    setLines((prev) => {
      setPendingFocusIndex(prev.length);
      return [...prev, { itemId: "", qty: "", rate: "", unit: "", description: "", warehouseId: inventorySettings?.defaultWarehouseId || "" }];
    });
  };

  React.useEffect(() => {
    if (pendingFocusIndex !== null && lines[pendingFocusIndex]) {
      // Small timeout to ensure the DOM element is rendered and associated with the ref
      const timer = setTimeout(() => {
        safeFocus(rowRefs.current.select[pendingFocusIndex]);
        setPendingFocusIndex(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lines, pendingFocusIndex]);

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const updateSundry = (id: string, patch: Partial<BillSundryRow>) =>
    setBillSundries((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addSundry = () =>
    setBillSundries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", type: "add", ratePct: "0" },
    ]);

  const removeSundry = (id: string) => setBillSundries((prev) => prev.filter((r) => r.id !== id));

  const buildPayload = () => {
    if (!form.partyId || !form.receivableAccountId) {
      throw new Error("Customer and receivable account are required.");
    }
    if (!form.paymentMethod) {
      throw new Error("Please select a payment method.");
    }

    const payloadItems = lines
      .filter((l) => l.itemId)
      .map((l, idx) => {
        const qty = Number(l.qty);
        const rate = Number(l.rate);

        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Line ${idx + 1}: Quantity must be greater than zero.`);
        }
        if (isNaN(rate) || rate <= 0) {
          throw new Error(`Line ${idx + 1}: Rate is required and must be greater than zero.`);
        }

        const item = items.find(i => i.id === l.itemId);
        if (item && item.type !== 'services' && (item.stock !== undefined) && qty > item.stock) {
          throw new Error(`Line ${idx + 1}: Quantity exceeds available stock (${item.stock}).`);
        }
        const tracked = item && item.type !== "services" && item.trackInventory !== false && inventorySettings?.inventoryTrackingEnabled;
        const serialNumbers = (l.serialText || "")
          .split(/[\n,]+/)
          .map((serial) => serial.trim())
          .filter(Boolean);
        if (tracked && inventorySettings?.requireWarehouseOnMovements && !l.warehouseId && !inventorySettings.defaultWarehouseId) {
          throw new Error(`Line ${idx + 1}: Warehouse is required.`);
        }
        if (tracked && item?.tracksBatch && !l.batchNo?.trim()) {
          throw new Error(`Line ${idx + 1}: Batch number is required.`);
        }
        if (tracked && item?.tracksLot && !l.lotNo?.trim()) {
          throw new Error(`Line ${idx + 1}: Lot number is required.`);
        }
        if (tracked && item?.tracksExpiry && !l.expiryDate && !l.expiryDateBs) {
          throw new Error(`Line ${idx + 1}: Expiry date is required.`);
        }
        if (tracked && item?.isSerialized && serialNumbers.length !== qty) {
          throw new Error(`Line ${idx + 1}: Enter ${qty} serial number(s).`);
        }

        return {
          itemId: l.itemId,
          qty,
          rate,
          unit: l.unit,
          description: l.description || undefined,
          warehouseId: l.warehouseId || undefined,
          binId: l.binId || undefined,
          batchNo: l.batchNo?.trim() || undefined,
          lotNo: l.lotNo?.trim() || undefined,
          expiryDate: l.expiryDate || undefined,
          expiryDateBs: l.expiryDateBs || undefined,
          serialNumbers: serialNumbers.length ? serialNumbers : undefined,
        };
      });

    if (!payloadItems.length) throw new Error("Add at least one item line.");

    return {
      type: "sales" as const,
      partyId: form.partyId,
      date: form.invoiceDate.ad || undefined,
      dateBs: form.invoiceDate.bs || undefined,
      dueDate: form.dueDate.ad || undefined,
      dueDateBs: form.dueDate.bs || undefined,
      receivableAccountId: form.receivableAccountId,
      paymentMethodId: form.paymentMethodId || undefined,
      saleTypeId: form.saleTypeId || undefined,
      salesType: form.salesType,
      memo: form.memo || undefined,
      additionalNote: form.notes || undefined,
      referenceNo: form.referenceNo || undefined,
      items: payloadItems,
      sundries: billSundryComputed.rows.map(r => ({
        billSundryId: r.sundryId,
        name: r.name,
        type: r.type,
        rate: Number(r.ratePct) || null,
        amount: r.amount
      })).filter(s => Math.abs(s.amount) > 0.01)
    };
  };

  const onSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const editId = searchParams.get("id");
      let res: any;
      if (editId) {
        res = await updateInvoiceDraft(editId, buildPayload());
      } else {
        res = await createInvoiceDraft(buildPayload());
      }
      if (isOfflineQueuedResponse(res)) {
        setSuccess(res.message);
        window.lekhalyUnsavedChanges?.clear();
        return;
      }
      const id = res?.id ?? res?.invoiceId ?? res?.data?.id;
      setSuccess(id ? `Saved draft: ${id}` : "Saved draft.");
      window.lekhalyUnsavedChanges?.clear();
      if (!editId && id) {
        navigate(`/sales/create?id=${id}`, { replace: true });
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    window.lekhalySaveDraftBeforeLeave = onSave;
    return () => {
      if (window.lekhalySaveDraftBeforeLeave === onSave) delete window.lekhalySaveDraftBeforeLeave;
    };
  }, [onSave]);

  const onPost = async () => {
    setError(null);
    setSuccess(null);
    setSending(true);
    try {
      const editId = searchParams.get("id");
      let res: any;
      if (editId) {
        res = await updateInvoiceDraft(editId, buildPayload());
      } else {
        res = await createInvoiceDraft(buildPayload());
      }
      if (isOfflineQueuedResponse(res)) {
        setError("Offline mode: draft saved to local storage. Go online to sync it with the server before posting.");
        return;
      }
      const id = res?.id ?? res?.invoiceId ?? res?.data?.id ?? editId;
      if (!id) throw new Error("Failed to save draft before posting.");

      await postInvoice(id);
      setSuccess(`Invoice posted successfully: ${id}`);
      setTimeout(() => navigate("/sales"), 1500);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const onPreview = () => setSuccess("Preview: connect to your invoice preview route/API.");
  const onPrint = () => setSuccess("Print: connect to your PDF + print flow.");
  const onPrintPreview = () => setSuccess("Print Preview: PDF version loading...");

  // ? Early return AFTER all hooks are declared
  if (!mounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-6" onPaste={handlePaste}>
      <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4">
          <Button
            onClick={() => {
              const goToRegistry = () => navigate("/sales");
              const guard = window.lekhalyUnsavedChanges;
              if (guard && !guard.requestNavigation(goToRegistry)) return;
              goToRegistry();
            }}
            className="rounded-full h-10 px-4 bg-white text-slate-900 border border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-emerald-600 dark:hover:text-white dark:hover:border-emerald-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Registry
          </Button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold italic tracking-tight text-slate-900 dark:text-slate-100">
                {searchParams.get("id") ? (isEditMode ? "Edit Sales Invoice" : "View Sales Invoice") : "Create New Sales Invoice"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {searchParams.get("id")
                  ? `${invoiceStatus ? `Status: ${invoiceStatus.charAt(0).toUpperCase() + invoiceStatus.slice(1)}. ` : ""}${isEditMode ? "Modify the details below." : "Click Edit to modify this invoice."}`
                  : "Fill in the details below to create a new sales invoice."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditMode && searchParams.get("id") ? (
              <Button
                onClick={() => setIsEditMode(true)}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 h-11 px-8 font-black text-xs uppercase tracking-widest transition-all active:scale-95 border-none"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            ) : null}
          </div>
        </div>

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


        {/* Top area */}
        <section className="relative mb-6">
          <div className="absolute right-0 top-0 hidden w-[260px] flex-col gap-3 lg:flex">
            <DualDateInput
              ref={invoiceDateRef}
              label="Invoice Date"
              value={form.invoiceDate}
              accentColor="bg-emerald-600"
              onChange={(next) => setForm((f) => ({ ...f, invoiceDate: next }))}
              onEnterNext={() => safeFocus(dueDateRef.current)}
              disabled={!isEditMode || !!invoiceStatus && invoiceStatus !== "draft"}
            />
            <DualDateInput
              ref={dueDateRef}
              label="Due Date"
              value={form.dueDate}
              accentColor="bg-emerald-600"
              onChange={(next) => setForm((f) => ({ ...f, dueDate: next }))}
              onEnterNext={() => safeFocus(paymentMethodRef.current)}
              disabled={!isEditMode}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-12 lg:pr-[300px]">
            <div className="lg:col-span-4 space-y-3">
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Invoice No.</span>
                <Input
                  ref={invoiceNoRef}
                  value={form.invoiceNoDisplay}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceNoDisplay: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      safeFocus(paymentMethodRef.current);
                    }
                  }}
                  placeholder="System generated"
                  className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                  disabled={true}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Reference No.</span>
                <Input
                  ref={referenceNoRef}
                  value={form.referenceNo}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      customerSelectRef.current?.focus();
                    }
                  }}
                  placeholder="Enter reference (optional)"
                  className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                  disabled={!isEditMode}
                />
              </label>
            </div>

            <div className="lg:col-span-8 flex items-start lg:justify-center">
              <div className="w-full max-w-[520px]">
                <div className="text-xs text-muted-foreground">Payment method <span className="text-red-500">*</span></div>
                <div className="relative">
                  <SearchableSelect
                    buttonRef={paymentMethodRef}
                    placeholder="Select payment method…"
                    valueId={form.paymentMethodId}
                    onChange={(id, opt) => setForm((f) => ({ ...f, paymentMethodId: id, paymentMethod: opt?.name }))}
                    options={paymentMethods}
                    className="mt-2"
                    buttonClassName={cn(
                      "h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
                      (!form.paymentMethodId && isEditMode) ? "pr-[80px]" : "pr-4"
                    )}
                    disabled={!isEditMode}
                    onEnterNext={() => safeFocus(memoRef.current)}
                    onAdd={() => setAddPaymentMethodOpen(true)}
                  />
                  {!form.paymentMethodId && isEditMode && (
                    <Button
                      type="button"
                      onClick={() => setAddPaymentMethodOpen(true)}
                      className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 h-7 rounded-full px-3 text-[10px] bg-emerald-600 text-white border-none hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="mr-1.5 h-3 w-3" />
                      New
                    </Button>
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-xs text-muted-foreground">Memo / Remarks</div>
                  <Input
                    ref={memoRef}
                    value={form.memo}
                    onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        safeFocus(salesTypeRef.current);
                      }
                    }}
                    placeholder="Brief description of sales"
                    className="mt-2 h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    disabled={!isEditMode}
                  />
                </div>

                <div className="mt-4">
                  <div className="text-xs text-muted-foreground">Sales Type <span className="text-red-500">*</span></div>
                <div className="relative">
                  <SearchableSelect
                    buttonRef={salesTypeRef}
                    placeholder="Select sales type…"
                    valueId={form.saleTypeId}
                    onChange={(id, opt) => setForm((f) => ({ ...f, saleTypeId: id, salesType: opt?.name }))}
                    options={saleTypes}
                    className="mt-2"
                    buttonClassName={cn(
                      "h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
                      (!form.saleTypeId && isEditMode) ? "pr-[80px]" : "pr-4"
                    )}
                    disabled={!isEditMode}
                    onEnterNext={() => safeFocus(referenceNoRef.current)}
                    onAdd={() => setAddSaleTypeOpen(true)}
                  />
                  {!form.saleTypeId && isEditMode && (
                    <Button
                      type="button"
                      onClick={() => setAddSaleTypeOpen(true)}
                      className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 h-7 rounded-full px-3 text-[10px] bg-emerald-600 text-white border-none hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="mr-1.5 h-3 w-3" />
                      New
                    </Button>
                  )}
                </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:hidden sm:grid-cols-2">
              <DualDateInput
                label="Invoice Date"
                value={form.invoiceDate}
                accentColor="bg-emerald-600"
                onChange={(next) => setForm((f) => ({ ...f, invoiceDate: next }))}
                onEnterNext={() => safeFocus(dueDateRef.current)}
                disabled={!isEditMode}
              />
              <DualDateInput
                label="Due Date"
                value={form.dueDate}
                accentColor="bg-emerald-600"
                onChange={(next) => setForm((f) => ({ ...f, dueDate: next }))}
                onEnterNext={() => safeFocus(paymentMethodRef.current)}
                disabled={!isEditMode}
              />
            </div>
          </div>
        </section>

        {/* Customer */}
        <section className="mb-6">
          <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Customer</div>

          <div className="relative max-w-[980px]">
            <SearchableSelect<PartyRecord>
              buttonRef={customerSelectRef}
              placeholder="Search customer…"
              valueId={form.partyId}
              onChange={(id) => setForm((f) => ({ ...f, partyId: id }))}
              options={parties}
              getLabel={(p) => p.name}
              leftIcon={<Search className="h-4 w-4" />}
              onEnterNext={() => safeFocus(rowRefs.current.select[0])}
              onKeyDownCustom={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  safeFocus(sundryRefs.current.select[0]);
                }
              }}
              buttonClassName={cn("h-12 rounded-2xl bg-white dark:bg-slate-900", (!form.partyId && isEditMode) ? "pr-[160px]" : "pr-4")}
              disabled={!isEditMode}
              fallbackLabel={form.partyName}
              onAdd={() => setAddCustomerOpen(true)}
            />

            {!form.partyId && isEditMode && (
              <Button
                type="button"
                onClick={() => setAddCustomerOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full px-4 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/20 transition-all active:scale-95 font-bold uppercase tracking-widest"
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                New Customer
              </Button>
            )}
          </div>
        </section>

        {/* Add Column */}
        <div className="mb-3 flex flex-col items-end gap-1.5">
          <Button
            ref={addLineButtonRef}
            type="button"
            onClick={addLine}
            className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-95 border-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
          <div className="text-[10px] text-muted-foreground italic pr-2">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[9px] not-italic font-sans">Shift + Enter</kbd> to jump sundry column
          </div>
        </div>

        {/* Items Details */}
        <section className="mb-8 rounded-3xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Items Details</div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/30">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100/70 dark:bg-slate-900/40">
                  <tr>
                    <th className="w-[60px] px-4 py-3 text-left text-xs text-muted-foreground">S.No.</th>
                    <th className="w-[420px] min-w-[320px] px-4 py-3 text-left text-xs text-muted-foreground">Particulars</th>
                    <th className="w-[140px] px-4 py-3 text-left text-xs text-muted-foreground">
                      Qty <span className="text-red-500">*</span>
                    </th>
                    <th className="w-[120px] px-4 py-3 text-left text-xs text-muted-foreground">Unit</th>
                    <th className="w-[180px] px-4 py-3 text-left text-xs text-muted-foreground">
                      Rate <span className="text-red-500">*</span>
                    </th>
                    <th className="w-[180px] px-4 py-3 text-right text-xs text-muted-foreground">Amount</th>
                    <th className="w-[70px] px-4 py-3 text-right text-xs text-muted-foreground" />
                  </tr>
                </thead>

                <tbody>
                  {lines.map((line, idx) => {
                    const qty = Number(line.qty || 0);
                    const rate = Number(line.rate || 0);
                    const amt = qty * rate;
                    const selectedItem = items.find((it) => it.id === line.itemId);
                    const needsInventoryFields = Boolean(
                      inventorySettings?.inventoryTrackingEnabled &&
                      selectedItem &&
                      selectedItem.type !== "services" &&
                      selectedItem.trackInventory !== false &&
                      (
                        inventorySettings.warehousesEnabled ||
                        inventorySettings.batchTrackingEnabled ||
                        inventorySettings.lotTrackingEnabled ||
                        inventorySettings.expiryTrackingEnabled ||
                        inventorySettings.serialTrackingEnabled
                      )
                    );
                    const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === line.warehouseId);
                    const bins = selectedWarehouse?.bins ?? [];

                    return (
                      <React.Fragment key={idx}>
                      <tr className="border-t border-slate-200/70 dark:border-slate-800/60">
                        <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <SearchableSelect<ItemRecord>
                              buttonRef={(el) => { rowRefs.current.select[idx] = el; }}
                              placeholder="Search item…"
                              valueId={line.itemId}
                              onChange={(id, item) => {
                                updateLine(idx, {
                                  itemId: id,
                                  unit: item?.unit || "",
                                  rate: item?.salesPrice?.toString() || "",
                                  description: item?.name || ""
                                });
                              }}
                              options={items}
                              getLabel={(it) => {
                                const sku = it.sku ? ` [${it.sku}]` : "";
                                return `${it.name}${sku}`;
                              }}
                              getDetail={(it) => {
                                if (it.type === "services") return "Service";
                                return `Stock: ${it.stock ?? 0} ${it.unit ?? ""}`;
                              }}
                              onEnterNext={() => safeFocus(rowRefs.current.qty[idx])}
                              onKeyDownCustom={(e) => {
                                if (e.key === "Enter" && e.shiftKey) {
                                  e.preventDefault();
                                  safeFocus(sundryRefs.current.rate[0]);
                                  return;
                                }
                                if (e.key === "ArrowRight") {
                                  e.preventDefault();
                                  safeFocus(rowRefs.current.qty[idx]);
                                }
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  if (rowRefs.current.select[idx + 1]) {
                                    safeFocus(rowRefs.current.select[idx + 1]);
                                  } else {
                                    safeFocus(sundryRefs.current.rate[0]);
                                  }
                                }
                                if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  if (rowRefs.current.select[idx - 1]) {
                                    safeFocus(rowRefs.current.select[idx - 1]);
                                  } else {
                                    safeFocus(customerSelectRef.current);
                                  }
                                }
                              }}
                              leftIcon={<Search className="h-4 w-4" />}
                              buttonClassName={cn(
                                "h-11 rounded-2xl bg-white dark:bg-slate-900",
                                (!line.itemId && isEditMode) ? "pr-[100px]" : "pr-4"
                              )}
                              emptyText="No items found"
                              onAdd={() => {
                                setActiveLineIdx(idx);
                                setAddItemOpen(true);
                              }}
                            />
                            {!line.itemId && (
                              <Button
                                type="button"
                                onClick={() => {
                                  setActiveLineIdx(idx);
                                  setAddItemOpen(true);
                                }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 rounded-xl px-3 text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add item
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Input
                            ref={(el) => { rowRefs.current.qty[idx] = el; }}
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.qty}
                            onChange={(e) => {
                              const val = e.target.value;
                              const currentItem = items.find(i => i.id === line.itemId);
                              if (currentItem && currentItem.type !== "services" && Number(val) > (currentItem.stock ?? 0)) {
                                setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], qty: "Exceeds stock" } }));
                              } else {
                                setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], qty: undefined } }));
                              }
                              updateLine(idx, { qty: val });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowRight") {
                                e.preventDefault();
                                safeFocus(rowRefs.current.rate[idx]);
                              }
                              if (e.key === "ArrowLeft") {
                                e.preventDefault();
                                safeFocus(rowRefs.current.select[idx]);
                              }
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                if (rowRefs.current.qty[idx + 1]) {
                                  safeFocus(rowRefs.current.qty[idx + 1]);
                                } else {
                                  safeFocus(sundryRefs.current.rate[0]);
                                }
                              }
                              if (e.key === "ArrowUp") {
                                e.preventDefault();
                                if (rowRefs.current.qty[idx - 1]) {
                                  safeFocus(rowRefs.current.qty[idx - 1]);
                                } else {
                                  safeFocus(rowRefs.current.select[idx]);
                                }
                              }
                              if (e.key === "Enter") {
                                if (e.shiftKey) {
                                  e.preventDefault();
                                  safeFocus(sundryRefs.current.rate[0]);
                                  return;
                                }
                                if (!line.qty || Number(line.qty) <= 0) {
                                  setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], qty: "Required" } }));
                                  return;
                                }
                                e.preventDefault();
                                safeFocus(rowRefs.current.rate[idx]);
                              }
                            }}
                            onBlur={() => {
                              if (line.itemId && (!line.qty || Number(line.qty) <= 0)) {
                                setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], qty: "Required" } }));
                              }
                            }}
                            className={cn(
                              "h-11 rounded-2xl bg-white text-center dark:bg-slate-900 transition-colors",
                              lineErrors[idx]?.qty && "border-red-500 focus:ring-red-200"
                            )}
                          />
                          {lineErrors[idx]?.qty && (
                            <div className="mt-1 text-[10px] text-red-500 font-medium text-center">
                              {lineErrors[idx].qty}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            value={line.unit || ""}
                            readOnly
                            placeholder="Unit"
                            className="h-11 rounded-2xl bg-slate-50/40 text-center dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-muted-foreground cursor-not-allowed"
                            disabled
                          />
                        </td>

                        <td className="px-4 py-3 align-top">
                          <Input
                            ref={(el) => { rowRefs.current.rate[idx] = el; }}
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.rate}
                            onChange={(e) => {
                              updateLine(idx, { rate: e.target.value });
                              setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], rate: undefined } }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowLeft") {
                                e.preventDefault();
                                safeFocus(rowRefs.current.qty[idx]);
                              }
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                if (rowRefs.current.rate[idx + 1]) {
                                  safeFocus(rowRefs.current.rate[idx + 1]);
                                } else {
                                  safeFocus(sundryRefs.current.rate[0]);
                                }
                              }
                              if (e.key === "ArrowUp") {
                                e.preventDefault();
                                if (rowRefs.current.rate[idx - 1]) {
                                  safeFocus(rowRefs.current.rate[idx - 1]);
                                } else {
                                  safeFocus(rowRefs.current.qty[idx]);
                                }
                              }
                              if (e.key === "Enter") {
                                if (e.shiftKey) {
                                  e.preventDefault();
                                  safeFocus(sundryRefs.current.rate[0]);
                                  return;
                                }
                                if (!line.rate || Number(line.rate) <= 0) {
                                  setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], rate: "Required" } }));
                                  return;
                                }
                                e.preventDefault();
                                if (rowRefs.current.select[idx + 1]) {
                                  safeFocus(rowRefs.current.select[idx + 1]);
                                } else {
                                  safeFocus(addLineButtonRef.current);
                                }
                              }
                            }}
                            onBlur={() => {
                              if (line.itemId && (!line.rate || Number(line.rate) <= 0)) {
                                setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], rate: "Required" } }));
                              }
                            }}
                            className={cn(
                              "h-11 rounded-2xl bg-white text-center dark:bg-slate-900 transition-colors",
                              lineErrors[idx]?.rate && "border-red-500 focus:ring-red-200"
                            )}
                            placeholder="Rate"
                          />
                          {lineErrors[idx]?.rate && (
                            <div className="mt-1 text-[10px] text-red-500 font-medium text-center">
                              {lineErrors[idx].rate}
                            </div>
                          )}
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
                      {needsInventoryFields && (
                        <tr className="border-t border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
                          <td />
                          <td colSpan={6} className="px-4 py-3">
                            <div className="grid gap-3 md:grid-cols-6">
                              {inventorySettings?.warehousesEnabled && (
                                <select
                                  value={line.warehouseId || inventorySettings.defaultWarehouseId || ""}
                                  disabled={!isEditMode || (!!invoiceStatus && invoiceStatus !== "draft")}
                                  onChange={(event) => updateLine(idx, { warehouseId: event.target.value, binId: "" })}
                                  className="h-10 rounded-xl border bg-white px-3 text-xs dark:bg-slate-900"
                                >
                                  <option value="">Warehouse</option>
                                  {warehouses.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                                  ))}
                                </select>
                              )}
                              {inventorySettings?.binsEnabled && (
                                <select
                                  value={line.binId || ""}
                                  disabled={!line.warehouseId || !isEditMode || (!!invoiceStatus && invoiceStatus !== "draft")}
                                  onChange={(event) => updateLine(idx, { binId: event.target.value })}
                                  className="h-10 rounded-xl border bg-white px-3 text-xs dark:bg-slate-900"
                                >
                                  <option value="">Bin</option>
                                  {bins.map((bin) => (
                                    <option key={bin.id} value={bin.id}>{bin.name}</option>
                                  ))}
                                </select>
                              )}
                              {inventorySettings?.batchTrackingEnabled && (
                                <Input value={line.batchNo || ""} onChange={(e) => updateLine(idx, { batchNo: e.target.value })} placeholder={selectedItem?.tracksBatch ? "Batch Number *" : "Batch Number"} className="h-10 rounded-xl text-xs" />
                              )}
                              {inventorySettings?.lotTrackingEnabled && (
                                <Input value={line.lotNo || ""} onChange={(e) => updateLine(idx, { lotNo: e.target.value })} placeholder={selectedItem?.tracksLot ? "Lot Number *" : "Lot Number"} className="h-10 rounded-xl text-xs" />
                              )}
                              {inventorySettings?.expiryTrackingEnabled && (
                                <Input type="date" value={line.expiryDate || ""} onChange={(e) => updateLine(idx, { expiryDate: e.target.value })} className="h-10 rounded-xl text-xs" />
                              )}
                              {selectedItem?.isSerialized && inventorySettings?.serialTrackingEnabled && (
                                <textarea
                                  value={line.serialText || ""}
                                  onChange={(event) => updateLine(idx, { serialText: event.target.value })}
                                  placeholder="Serial numbers"
                                  className="min-h-10 rounded-xl border bg-white px-3 py-2 text-xs dark:bg-slate-900 md:col-span-2"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}

                  <tr className="border-t bg-slate-100/60 font-semibold dark:bg-slate-900/40">
                    <td />
                    <td className="px-4 py-3 text-right">
                      Total
                    </td>
                    <td className="px-4 py-3 text-center">
                      {totalQty % 1 === 0 ? totalQty : totalQty.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <MoneyText value={totalRate} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MoneyText value={itemsSubtotal} />
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>



        <div className="mb-4 flex flex-col items-end gap-2 text-right">


          <Button ref={addSundryButtonRef} type="button" onClick={addSundry} className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 border-none">
            <Plus className="mr-2 h-4 w-4" />
            Add Sundry Column
          </Button>

        </div>

        {/* BILL SUNDRY */}
        <section className="mb-6">
          {/* <div className="mb-3 text-center text-sm font-semibold tracking-[0.32em] text-slate-800 dark:text-slate-100">
            BILL SUNDRY
          </div> */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">


            <div className="mr-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Bill Sundry Details</div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100/70 dark:bg-slate-900/40">
                  <tr>
                    <th className="w-[70px] px-3 py-2 text-left text-xs text-muted-foreground">S.N.</th>
                    <th className="px-3 py-2 text-left text-xs text-muted-foreground">Bill Sundry</th>
                    <th className="w-[140px] px-3 py-2 text-right text-xs text-muted-foreground">@</th>
                    <th className="w-[200px] px-3 py-2 text-right text-xs text-muted-foreground">Amount ({ui.currencySymbol})</th>
                    <th className="w-[60px] px-3 py-2 text-right text-xs text-muted-foreground" />
                  </tr>
                </thead>

                <tbody>
                  {billSundryComputed.rows.map((r, i) => (
                    <tr key={r.id} className="border-t border-slate-200/70 dark:border-slate-800/60">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">
                        <div className="relative">
                          <SearchableSelect<BillSundryRecord>
                            buttonRef={(el) => { sundryRefs.current.select[i] = el; }}
                            placeholder="Search sundry…"
                            valueId={r.sundryId || ""}
                            fallbackLabel={r.name}
                            onChange={(id, opt) => {
                              if (opt) {
                                updateSundry(r.id, {
                                  sundryId: opt.id,
                                  name: opt.name,
                                  type: opt.type as any,
                                  ratePct: opt.rate?.toString() || "0"
                                });
                              } else {
                                updateSundry(r.id, { sundryId: id, name: "" });
                              }
                            }}
                            onKeyDownCustom={(e) => {
                              if (e.key === "Enter" && e.shiftKey) {
                                e.preventDefault();
                                safeFocus(termsRef.current);
                                return;
                              }
                              if (e.key === "ArrowRight") {
                                e.preventDefault();
                                safeFocus(sundryRefs.current.rate[i]);
                              }
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                if (sundryRefs.current.select[i + 1]) {
                                  safeFocus(sundryRefs.current.select[i + 1]);
                                } else {
                                  safeFocus(termsRef.current);
                                }
                              }
                              if (e.key === "ArrowUp") {
                                e.preventDefault();
                                if (sundryRefs.current.select[i - 1]) {
                                  safeFocus(sundryRefs.current.select[i - 1]);
                                } else {
                                  const lastItemIdx = lines.length - 1;
                                  safeFocus(rowRefs.current.select[lastItemIdx]);
                                }
                              }
                            }}
                            onEnterNext={() => safeFocus(sundryRefs.current.rate[i])}
                            options={sundryOptions}
                            getLabel={(s) => s.name}
                            buttonClassName="h-10 rounded-xl pr-[110px]"
                            emptyText="No sundries found"
                            disabled={r.id === "vat" || r.id === "discount"}
                          />
                          {!r.sundryId && r.id !== "discount" && r.id !== "vat" && (
                            <Button
                              type="button"
                              onClick={() => {
                                setActiveSundryIdx(i);
                                setAddSundryOpen(true);
                              }}
                              className="absolute z-10 right-7 top-1/2 -translate-y-1/2 h-7 rounded-lg px-1.5 text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                            >
                              <Plus className="h-3 w-3" />
                              Define New
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Input
                            ref={(el) => { sundryRefs.current.rate[i] = el; }}
                            value={r.ratePct}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateSundry(r.id, {
                                ratePct: val,
                                isManual: false
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowRight") {
                                e.preventDefault();
                                safeFocus(sundryRefs.current.amount[i]);
                              }
                              if (e.key === "ArrowLeft") {
                                e.preventDefault();
                                safeFocus(sundryRefs.current.select[i]);
                              }
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                if (sundryRefs.current.rate[i + 1]) {
                                  safeFocus(sundryRefs.current.rate[i + 1]);
                                } else {
                                  safeFocus(termsRef.current);
                                }
                              }
                              if (e.key === "ArrowUp") {
                                e.preventDefault();
                                if (sundryRefs.current.rate[i - 1]) {
                                  safeFocus(sundryRefs.current.rate[i - 1]);
                                } else {
                                  const lastItemIdx = lines.length - 1;
                                  safeFocus(rowRefs.current.rate[lastItemIdx]);
                                }
                              }
                              if (e.key === "Enter") {
                                if (e.shiftKey) {
                                  e.preventDefault();
                                  safeFocus(termsRef.current);
                                  return;
                                }
                                e.preventDefault();
                                if (sundryRefs.current.amount[i]) {
                                  safeFocus(sundryRefs.current.amount[i]);
                                } else if (sundryRefs.current.select[i + 1]) {
                                  safeFocus(sundryRefs.current.select[i + 1]);
                                } else {
                                  // Optionally focus save button
                                }
                              }
                            }}
                            disabled={r.id === "vat"}
                            className="h-10 w-[110px] rounded-xl bg-white text-right dark:bg-slate-900"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        <div className="inline-flex items-center justify-end gap-1">
                          {r.type === "less" ? "(" : null}
                          <div className="flex items-center">
                            <span className="mr-1 text-xs text-muted-foreground font-normal">{ui.currencySymbol}</span>
                            <Input
                              ref={(el) => { sundryRefs.current.amount[i] = el; }}
                              value={r.isManual ? (r.manualAmount || "") : (r.ratePct && Number(r.ratePct) !== 0 ? r.amount.toFixed(2) : "")}
                              onChange={(e) => {
                                const val = e.target.value;
                                const amt = Number(val || 0);
                                const pct = itemsSubtotal > 0 ? (amt / itemsSubtotal) * 100 : 0;
                                updateSundry(r.id, {
                                  manualAmount: val,
                                  ratePct: pct % 1 === 0 ? pct.toString() : pct.toFixed(2),
                                  isManual: true
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "ArrowLeft") {
                                  e.preventDefault();
                                  safeFocus(sundryRefs.current.rate[i]);
                                }
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  if (sundryRefs.current.amount[i + 1]) {
                                    safeFocus(sundryRefs.current.amount[i + 1]);
                                  } else {
                                    safeFocus(termsRef.current);
                                  }
                                }
                                if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  if (sundryRefs.current.amount[i - 1]) {
                                    safeFocus(sundryRefs.current.amount[i - 1]);
                                  } else {
                                    const lastItemIdx = lines.length - 1;
                                    safeFocus(rowRefs.current.rate[lastItemIdx]);
                                  }
                                }
                                if (e.key === "Enter") {
                                  if (e.shiftKey) {
                                    e.preventDefault();
                                    safeFocus(termsRef.current);
                                    return;
                                  }
                                  e.preventDefault();
                                  if (sundryRefs.current.select[i + 1]) {
                                    safeFocus(sundryRefs.current.select[i + 1]);
                                  } else {
                                    safeFocus(addSundryButtonRef.current);
                                  }
                                }
                              }}
                              placeholder="0.00"
                              disabled={r.id === "vat"}
                              className="h-8 w-24 rounded-lg border-slate-200 bg-white px-2 text-right text-sm dark:border-slate-800 dark:bg-slate-900"
                            />
                          </div>
                          {r.type === "less" ? ")" : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeSundry(r.id)}
                          disabled={r.id === "vat" || r.id === "discount"}
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-red-600 hover:bg-red-50",
                            (billSundries.length <= 1 || r.id === "vat" || r.id === "discount") && "pointer-events-none opacity-50"
                          )}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* TERMS */}
        <section className="mb-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <button type="button" onClick={() => setShowTerms((v) => !v)} className="flex w-full items-center gap-3">
            <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showTerms && "rotate-90")} />
            <div className="text-sm font-semibold">Terms &amp; Conditions</div>
          </button>

          <div className="mt-2 text-sm text-muted-foreground">Using company default</div>

          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="mt-3 text-sm font-medium text-slate-700 hover:underline dark:text-slate-200"
            disabled={!isEditMode}
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
                <span>Override for this invoice</span>
              </label>

              <textarea
                ref={termsRef}
                value={form.termsText}
                onChange={(e) => setForm((f) => ({ ...f, termsText: e.target.value }))}
                disabled={!isEditMode || !form.termsOverrideEnabled}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.shiftKey) {
                    e.preventDefault();
                    safeFocus(notesRef.current);
                  }
                  if (e.key === "ArrowDown" && !e.shiftKey) {
                    e.preventDefault();
                    safeFocus(notesRef.current);
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const lastSundryIdx = billSundryComputed.rows.length - 1;
                    safeFocus(sundryRefs.current.rate[lastSundryIdx]);
                  }
                }}
                className={cn(
                  "min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950",
                  !form.termsOverrideEnabled && "opacity-70"
                )}
              />
            </div>
          ) : null}
        </section>

        {/* Bottom */}
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 text-sm font-semibold">Summary</div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/30">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxable Total</span>
                  <div className="font-medium">
                    <MoneyText value={taxableAmount} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Non-Taxable Total</span>
                  <div className="font-medium">
                    <MoneyText value={nonTaxableAmount} />
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1 op-40" />

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <div className="font-medium">
                    <MoneyText value={itemsSubtotal} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <div className="font-medium">
                    <MoneyText value={billSundryComputed.rows.find((r) => r.id === "discount")?.amount ?? 0} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <div className="font-medium">
                    <MoneyText value={billSundryComputed.rows.find((r) => r.id === "vat")?.amount ?? 0} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Other Sundry</span>
                  <div className="font-medium">
                    <MoneyText value={otherSundryTotal} />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950">
                <div className="text-sm font-semibold">Total</div>
                <div className="text-sm font-semibold">
                  <MoneyText value={total} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Additional notes</div>
              <div className="text-xs text-muted-foreground">
                BS: <span className="font-medium text-foreground">{form.invoiceDate.bs || "�"}</span>{" "}
                <span className="text-muted-foreground">({form.invoiceDate.ad || "�"})</span>
              </div>
            </div>

            <textarea
              ref={notesRef}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  safeFocus(termsRef.current);
                }
              }}
              placeholder="Add overall remarks or terms for this sale..."
              className="min-h-[120px] w-full rounded-2xl border-2 border-slate-100 bg-slate-50/30 p-5 text-sm outline-none ring-emerald-500/10 focus:border-emerald-500 focus:bg-white focus:ring-4 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 transition-all font-medium leading-relaxed"
              disabled={!isEditMode}
            />
          </div>

          <div className="lg:col-span-12">
            {/* Static Action Footer */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8 pb-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items Subtotal</span>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                      <MoneyText value={itemsSubtotal} />
                    </div>
                  </div>
                  <div className="hidden md:block w-px h-10 bg-slate-100 dark:bg-slate-800" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Grand Total</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      <MoneyText value={total} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {!invoiceStatus || invoiceStatus === "draft" ? (
                    <>
                      {isEditMode ? (
                        <Button
                          onClick={onSave}
                          disabled={loading || sending}
                          className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {loading ? "Saving..." : "Save Draft"}
                        </Button>
                      ) : null}

                      <Button
                        onClick={onPost}
                        disabled={loading || sending || !isEditMode}
                        className="flex-1 md:flex-none rounded-2xl h-12 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 shadow-emerald-500/25 bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sending ? "Posting..." : "Post & Finalize"}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={onPrint}
                        className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                      <Button
                        onClick={onPreview}
                        className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 bg-emerald-600 text-white hover:bg-emerald-700 border-none"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <AddItemDialog
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        onSuccess={(newItem) => {
          setItems(prev => [...prev, newItem]);
          if (activeLineIdx !== null) {
            updateLine(activeLineIdx, {
              itemId: newItem.id,
              rate: newItem.salesPrice?.toString() || ""
            });
            setTimeout(() => safeFocus(rowRefs.current.qty[activeLineIdx]), 50);
          }
        }}
      />
      <AddCustomerDialog
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        onSuccess={(newCustomer) => {
          setParties(prev => [...prev, newCustomer]);
          setForm(f => ({ ...f, partyId: newCustomer.id }));
          setTimeout(() => safeFocus(rowRefs.current.select[0]), 50);
        }}
      />
      <AddBillSundryDialog
        open={addSundryOpen}
        onClose={() => setAddSundryOpen(false)}
        onSuccess={(newSundry) => {
          setSundryOptions(prev => [...prev, newSundry]);
          if (activeSundryIdx !== null) {
            const r = billSundries[activeSundryIdx];
            if (r) {
              updateSundry(r.id, {
                sundryId: newSundry.id,
                name: newSundry.name,
                type: newSundry.type as any,
                ratePct: newSundry.rate?.toString() || "0"
              });
            }
          }
        }}
      />

      <AddPaymentMethodDialog
        open={addPaymentMethodOpen}
        onClose={() => setAddPaymentMethodOpen(false)}
        onSuccess={(method) => {
          setPaymentMethods(prev => [...prev, method]);
          setForm(f => ({ ...f, paymentMethodId: method.id, paymentMethod: method.name }));
        }}
      />

      <AddSaleTypeDialog
        open={addSaleTypeOpen}
        onClose={() => setAddSaleTypeOpen(false)}
        onSuccess={(st) => {
          setSaleTypes(prev => [...prev, st]);
          setForm(f => ({ ...f, saleTypeId: st.id, salesType: st.name }));
        }}
      />
    </div>
  );
}

