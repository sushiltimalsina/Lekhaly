"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import DualDateInput from "@/components/app/dual-date-input";
import PageHeader from "@/components/app/page-header";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";

import { createVoucherDraft, postVoucher, getVoucher, updateVoucherDraft, type VoucherDraftInput } from "@/lib/api/vouchers";
import { isOfflineQueuedResponse } from "@/lib/api/client";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listItems, type ItemRecord } from "@/lib/api/items";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddVendorDialog from "@/components/app/add-vendor-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import { listBillSundries, type BillSundryRecord } from "@/lib/api/bill-sundries";
import { useUiState } from "@/lib/store/ui";
import { useExcelPaste } from "@/hooks/use-excel-paste";

import {
    Plus,
    Trash2,
    Save,
    Send,
    ChevronDown,
    Check,
    Eye,
    Printer,
    FileText,
    ChevronRight,
    ArrowLeft,
    ShoppingBag,
    History,
    Search,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import { toBs } from "@/lib/dates/bs";
import { useRouter, useSearchParams } from "next/navigation";
import { listPaymentMethods } from "@/lib/api/payment-methods";
import { listPurchaseTypes } from "@/lib/api/purchase-types";
import AddPaymentMethodDialog from "@/components/app/add-payment-method-dialog";
import AddPurchaseTypeDialog from "@/components/app/add-purchase-type-dialog";
import { getInventorySettings, type InventorySettings } from "@/lib/api/inventory";
import { listWarehouses, type Warehouse } from "@/lib/api/warehouses";

type Line = {
    itemId: string;
    qty: string;
    rate: string;
    unit?: string;
    description?: string;
    expenseAccountId?: string;
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
    buttonRef?: React.Ref<HTMLButtonElement>;
    onEnterNext?: () => void;
    onKeyDownCustom?: (e: React.KeyboardEvent<any>) => void;
    fallbackLabel?: string;
    disabled?: boolean;
    onAdd?: () => void;
}) {
    const {
        label,
        placeholder = "Select…",
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
        onAdd,
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
            // Also search in code/sku if available
            const code = (o as any).code?.toLowerCase() || "";
            const sku = (o as any).sku?.toLowerCase() || "";
            const hsCode = (o as any).hsCode?.toLowerCase() || "";
            return labelText.includes(q) || code.includes(q) || sku.includes(q) || hsCode.includes(q);
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
            {label ? <div className="text-xs text-muted-foreground ml-1">{label}</div> : null}

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
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {open
                ? createPortal(
                    <div
                        ref={menuRef}
                        style={menuStyle}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
                    >
                        <div className="border-b border-slate-100 p-2 dark:border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            setActiveIndex((v) => (v + 1) % filtered.length);
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            setActiveIndex((v) => (v - 1 + filtered.length) % filtered.length);
                                        } else if (e.key === "Enter") {
                                            e.preventDefault();
                                            const opt = filtered[activeIndex];
                                            if (opt) {
                                                onChange(opt.id, opt);
                                                setOpen(false);
                                                setQuery("");
                                                props.onEnterNext?.();
                                            }
                                        } else if (e.key === "Escape") {
                                            setOpen(false);
                                        }
                                        props.onKeyDownCustom?.(e);
                                    }}
                                    placeholder="Type to search…"
                                    className="w-full rounded-xl border-none bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-0 dark:bg-slate-800/50"
                                />
                            </div>
                        </div>

                        <div ref={listRef} className="max-h-[300px] overflow-auto p-1 scroll-smooth">
                            {filtered.length ? (
                                filtered.map((o, i) => {
                                    const labelText = getLabel ? getLabel(o) : o.name ?? o.id;
                                    const selected = o.id === valueId;
                                    const active = i === activeIndex;

                                    return (
                                        <button
                                            key={o.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(o.id, o);
                                                setOpen(false);
                                                setQuery("");
                                                props.onEnterNext?.();
                                            }}
                                            onMouseEnter={() => setActiveIndex(i)}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                                                active ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                                selected && !active && "bg-slate-50 dark:bg-slate-800/30"
                                            )}
                                        >
                                            <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                                                <span className="truncate font-medium">{labelText}</span>
                                                {getDetail && getDetail(o) && (
                                                    <span className={cn("text-xs whitespace-nowrap", selected ? "text-orange-600/80" : "text-muted-foreground")}>
                                                        {getDetail(o)}
                                                    </span>
                                                )}
                                            </div>
                                            {selected ? <Check className="h-4 w-4 text-orange-600" /> : null}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <div className="text-sm text-muted-foreground">{emptyText}</div>
                                    {onAdd && (
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAdd();
                                                setOpen(false);
                                            }}
                                            className="mt-3 rounded-full h-8 px-4 text-[10px] bg-orange-600 hover:bg-orange-700 text-white border-none"
                                        >
                                            <Plus className="mr-1.5 h-3 w-3" />
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

const isoAddDays = (iso: string, days: number) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

export default function PurchaseCreatePage() {
    return (
        <React.Suspense fallback={null}>
            <PurchaseCreateContent />
        </React.Suspense>
    );
}

function PurchaseCreateContent() {
    const [mounted, setMounted] = React.useState(false);

    const purchaseDateRef = React.useRef<HTMLInputElement>(null);
    const vendorInvoiceDateRef = React.useRef<HTMLInputElement>(null);
    const invoiceNoRef = React.useRef<HTMLInputElement>(null);
    const vendorInvoiceNoRef = React.useRef<HTMLInputElement>(null);
    const payableAccountRef = React.useRef<HTMLButtonElement>(null);
    const purchaseTypeRef = React.useRef<HTMLButtonElement>(null);
    const paymentMethodRef = React.useRef<HTMLButtonElement>(null);
    const memoRef = React.useRef<HTMLInputElement>(null);
    const referenceNoRef = React.useRef<HTMLInputElement>(null);
    const vendorSelectRef = React.useRef<HTMLButtonElement>(null);
    const addLineButtonRef = React.useRef<HTMLButtonElement>(null);
    const addSundryButtonRef = React.useRef<HTMLButtonElement>(null);
    const [lineErrors, setLineErrors] = React.useState<Record<number, { qty?: string; rate?: string }>>({});
    const [addItemOpen, setAddItemOpen] = React.useState(false);
    const [activeLineIdx, setActiveLineIdx] = React.useState<number | null>(null);
    const [addVendorOpen, setAddVendorOpen] = React.useState(false);
    const [addPaymentMethodOpen, setAddPaymentMethodOpen] = React.useState(false);
    const [addPurchaseTypeOpen, setAddPurchaseTypeOpen] = React.useState(false);
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
    const notesRef = React.useRef<HTMLInputElement>(null);

    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [items, setItems] = React.useState<ItemRecord[]>([]);
    const [sundryOptions, setSundryOptions] = React.useState<BillSundryRecord[]>([]);
    const [paymentMethods, setPaymentMethods] = React.useState<any[]>([]);
    const [purchaseTypes, setPurchaseTypes] = React.useState<any[]>([]);
    const [inventorySettings, setInventorySettings] = React.useState<InventorySettings | null>(null);
    const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);

    const safeFocus = (el: HTMLElement | null) => {
        if (!el) return;
        el.focus({ preventScroll: true });
    };

    React.useEffect(() => {
        if (mounted) {
            setTimeout(() => safeFocus(vendorInvoiceDateRef.current), 100);
        }
    }, [mounted]);

    const [loading, setLoading] = React.useState(false);
    const [sending, setSending] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        partyId: "",
        payableAccountId: "",
        purchaseDate: { bs: "", ad: "" },
        vendorInvoiceDate: { bs: "", ad: "" },
        referenceNo: "",
        vendorInvoiceNo: "",
        paymentMethod: "" as any,
        paymentMethodId: "",
        purchaseType: "vat_13" as any,
        purchaseTypeId: "",
        memo: "",
        notes: "",
    });

    const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "", rate: "" }]);

    const { handlePaste } = useExcelPaste<Line>({
        items,
        onPaste: (newLines) => {
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
                rate: cols[2]?.trim() || item.purchasePrice?.toString() || "0",
                unit: item.unit || "",
                description: `${item.name}${item.sku ? ` [${item.sku}]` : ""}`,
                expenseAccountId: item.expenseAccountId || undefined
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

    const defaultPayable = React.useMemo(() => accounts[0]?.id ?? "", [accounts]);

    React.useEffect(() => setMounted(true), []);

    const ui = useUiState();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isEditMode, setIsEditMode] = React.useState(true); // false when viewing existing voucher
    const [voucherStatus, setVoucherStatus] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (searchParams.get("id")) return; // Don't set default dates if editing/viewing existing
        const now = new Date();
        const ad = now.toISOString().slice(0, 10);
        const bs = toBs(ad);
        const refNo = Math.floor(100000 + Math.random() * 900000).toString();

        setForm((f) => ({
            ...f,
            purchaseDate: { bs, ad },
            vendorInvoiceDate: { bs, ad },
            referenceNo: refNo,
        }));
    }, [searchParams]);

    React.useEffect(() => {
        if (!form.payableAccountId && defaultPayable) {
            setForm((f) => ({ ...f, payableAccountId: defaultPayable }));
        }
    }, [defaultPayable]);

    React.useEffect(() => {
        let alive = true;

        const normalizeList = <T,>(input: unknown): T[] => {
            if (Array.isArray(input)) return input as T[];
            const obj = input as { items?: T[]; data?: T[] } | null;
            return obj?.items ?? obj?.data ?? [];
        };

        Promise.all([
            listParties({ type: "supplier", take: 200 }),
            listAccounts({ type: "liability", take: 200 }),
            listItems({ take: 200 }),
            listBillSundries({ take: 100 }),
            listPaymentMethods({ isActive: true }),
            listPurchaseTypes({ isActive: true }),
            getInventorySettings(),
            listWarehouses({ isActive: true })
        ])
            .then(([p, a, i, s, pm, pt, inv, wh]) => {
                if (!alive) return;
                setParties(normalizeList<PartyRecord>(p));
                setAccounts(normalizeList<AccountRecord>(a));
                setItems(normalizeList<ItemRecord>(i));
                const opts = normalizeList<BillSundryRecord>(s);
                setSundryOptions(opts);
                setPaymentMethods(normalizeList<any>(pm));
                setPurchaseTypes(normalizeList<any>(pt));
                setInventorySettings(inv as InventorySettings);
                setWarehouses(normalizeList<Warehouse>(wh));

                // Auto-link default sundries if they exist in the options
                setBillSundries(prev => prev.map(row => {
                    if (row.sundryId) return row;
                    // Try exact match first, then partial match
                    let match = opts.find(o => o.name.toLowerCase() === row.name.toLowerCase());
                    if (!match && row.id === "vat") {
                        match = opts.find(o => o.name.toLowerCase().includes("vat") || o.name.toLowerCase().includes("tax"));
                    }
                    if (!match && row.id === "discount") {
                        match = opts.find(o => o.name.toLowerCase().includes("discount"));
                    }

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
                    setIsEditMode(false); // Start in view mode for existing vouchers
                    getVoucher(editId).then(v => {
                        setVoucherStatus(v.status || null);
                        // Populate Form
                        const parseDate = (d: any) => {
                            if (!d) return "";
                            if (typeof d === "string") return d.split("T")[0];
                            if (d instanceof Date) return d.toISOString().split("T")[0];
                            return String(d).split("T")[0];
                        };

                        setForm(f => ({
                            ...f,
                            partyId: v.partyId || "",
                            voucherNumber: v.voucherNumber,
                            referenceNo: v.referenceNo || "",
                            purchaseDate: { ad: parseDate(v.voucherDate), bs: v.voucherDateBs || "" },
                            vendorInvoiceNo: v.vendorInvoiceNo || "",
                            vendorInvoiceDate: {
                                ad: parseDate(v.vendorInvoiceDate),
                                bs: v.vendorInvoiceDate ? toBs(parseDate(v.vendorInvoiceDate)) : ""
                            },
                            memo: v.memo || "",
                            notes: v.additionalNote || "",
                            partyName: v.party?.name || "",
                            purchaseType: v.purchaseType || "vat_13",
                            purchaseTypeId: v.purchaseTypeId || "",
                            paymentMethod: v.paymentMethod || "",
                            paymentMethodId: v.paymentMethodId || ""
                        }));

                        // Populate Lines (Items)
                        const vLines = v.lines || [];
                        const itemLines = vLines.filter((l: any) => l.itemId).map((l: any) => ({
                            itemId: l.itemId,
                            qty: String(Number(l.qty || 0)),
                            rate: l.qty && Number(l.qty) !== 0 ? String(Number(l.debit) / Number(l.qty)) : "0",
                            description: l.description,
                            expenseAccountId: l.accountId,
                            warehouseId: l.warehouseId || "",
                            binId: l.binId || "",
                            batchNo: l.batchNo || "",
                            lotNo: l.lotNo || "",
                            expiryDate: l.expiryDate ? String(l.expiryDate).split("T")[0] : "",
                            expiryDateBs: l.expiryDateBs || "",
                            serialText: Array.isArray(l.serialNumbers) ? l.serialNumbers.join("\n") : ""
                        }));
                        if (itemLines.length > 0) setLines(itemLines);

                        // Populate Sundries
                        const sundryLines = vLines.filter((l: any) => !l.itemId && l.accountId);
                        const mappedSundries: BillSundryRow[] = [];
                        sundryLines.forEach((l: any) => {
                            const matchingOpt = opts.find(o => o.accountId === l.accountId);
                            if (matchingOpt) {
                                mappedSundries.push({
                                    id: Math.random().toString(36).substr(2, 9),
                                    sundryId: matchingOpt.id,
                                    name: matchingOpt.name,
                                    type: l.debit > 0 ? "add" : "less",
                                    ratePct: "",
                                    manualAmount: String(Number(l.debit || l.credit || 0)),
                                    isManual: true
                                });
                            }
                        });
                        if (mappedSundries.length > 0) setBillSundries(mappedSundries);

                    }).catch(e => console.error("Failed to load voucher", e));
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
            if (r.id === "vat" && form.purchaseType !== "vat_13") return false;
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
    }, [billSundries, itemsSubtotal, form.purchaseType]);

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
            return [...prev, { itemId: "", qty: "", rate: "", warehouseId: inventorySettings?.defaultWarehouseId || "" }];
        });
    };

    React.useEffect(() => {
        if (pendingFocusIndex !== null && lines[pendingFocusIndex]) {
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

    const buildPayload = (): VoucherDraftInput => {
        if (!form.vendorInvoiceNo) {
            throw new Error("Vendor Invoice No. is required.");
        }
        if (!form.partyId) {
            throw new Error("Vendor is required.");
        }
        if (!form.payableAccountId) {
            throw new Error("Payable account is required. Please ensure liability accounts are set up.");
        }
        if (!form.paymentMethodId) {
            throw new Error("Please select a payment method.");
        }

        // Validate Items lines
        lines.forEach((l, idx) => {
            if (!l.itemId) {
                throw new Error(`Line ${idx + 1}: Item is required.`);
            }
            const qty = Number(l.qty);
            const rate = Number(l.rate);
            if (isNaN(qty) || qty <= 0) {
                throw new Error(`Line ${idx + 1}: Quantity must be greater than zero.`);
            }
            if (isNaN(rate) || rate <= 0) {
                throw new Error(`Line ${idx + 1}: Rate is required and must be greater than zero.`);
            }
            const item = items.find(it => it.id === l.itemId);
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
        });

        const payloadLines = lines.map((l) => {
            const qty = Number(l.qty);
            const rate = Number(l.rate);
            const item = items.find(it => it.id === l.itemId);
            return {
                itemId: l.itemId,
                accountId: l.expenseAccountId || item?.expenseAccountId || "",
                debit: qty * rate,
                qty,
                description: l.description || "Purchase",
                unit: l.unit,
                warehouseId: l.warehouseId || undefined,
                binId: l.binId || undefined,
                batchNo: l.batchNo?.trim() || undefined,
                lotNo: l.lotNo?.trim() || undefined,
                expiryDate: l.expiryDate || undefined,
                expiryDateBs: l.expiryDateBs || undefined,
                serialNumbers: (l.serialText || "")
                    .split(/[\n,]+/)
                    .map((serial) => serial.trim())
                    .filter(Boolean)
            };
        });

        if (!payloadLines.length) throw new Error("Add at least one item line.");

        // Validate and Add Sundry lines
        billSundryComputed.rows.forEach(r => {
            if (Math.abs(r.amount) < 0.01 && !r.isManual) return; // Skip zero amount rows unless manual

            // Validate Sundry Name/Selection
            if (!r.sundryId) {
                throw new Error(`Bill Sundry '${r.name || "Unknown"}' is not linked to a generic ledger account. Please select a valid sundry from the dropdown.`);
            }

            // Re-check amount for posting
            if (Math.abs(r.amount) < 0.01) return;

            // Find the account for this sundry
            const sundryOpt = sundryOptions.find(o => o.id === r.sundryId);
            const accountId = sundryOpt?.accountId;

            if (!accountId) {
                throw new Error(`Bill Sundry '${r.name}': No linked account found.`);
            }

            payloadLines.push({
                accountId: accountId,
                debit: r.type === "add" ? r.amount : 0,
                credit: r.type === "less" ? r.amount : 0,
                description: r.name,
            } as any);
        });

        // Add Credit line for Payable
        payloadLines.push({
            accountId: form.payableAccountId,
            partyId: form.partyId,
            credit: total,
            debit: 0,
            description: form.memo || "Purchase from vendor",
        } as any);

        return {
            voucherType: "purchase",
            voucherDate: form.purchaseDate.ad || undefined,
            voucherDateBs: form.purchaseDate.bs || undefined,
            partyId: form.partyId,
            memo: form.memo || "Purchase from vendor",
            additionalNote: form.notes || undefined,
            referenceNo: form.referenceNo || undefined,
            vendorInvoiceNo: form.vendorInvoiceNo || undefined,
            vendorInvoiceDate: form.vendorInvoiceDate.ad || undefined,
            purchaseType: form.purchaseType,
            purchaseTypeId: form.purchaseTypeId || undefined,
            paymentMethodId: form.paymentMethodId || undefined,
            paymentMethod: form.paymentMethod || undefined,
            lines: payloadLines as any,
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
                res = await updateVoucherDraft(editId, buildPayload());
            } else {
                res = await createVoucherDraft(buildPayload());
            }
            if (isOfflineQueuedResponse(res)) {
                setSuccess(res.message);
                return;
            }
            const id = editId ?? res?.id ?? res?.voucherId ?? res?.data?.id;
            setSuccess(id ? `Saved draft successfully.` : "Saved draft.");
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const onPost = async () => {
        setError(null);
        setSuccess(null);
        setSending(true);
        try {
            const editId = searchParams.get("id");
            let id = editId;

            if (editId) {
                const res = await updateVoucherDraft(editId, buildPayload());
                if (isOfflineQueuedResponse(res)) {
                    setError("Offline mode: draft saved to local storage. Go online to sync it with the server before posting.");
                    return;
                }
            } else {
                const res = await createVoucherDraft(buildPayload());
                if (isOfflineQueuedResponse(res)) {
                    setError("Offline mode: draft saved to local storage. Go online to sync it with the server before posting.");
                    return;
                }
                id = res?.id ?? res?.voucherId ?? res?.data?.id;
            }

            if (!id) throw new Error("Failed to identify draft ID.");

            await postVoucher(id);
            setSuccess(`Purchase posted successfully.`);
            setTimeout(() => router.push("/purchase"), 1500);
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setSending(false);
        }
    };

    const onPreview = () => setSuccess("Preview: connect to your invoice preview route/API.");
    const onPrint = () => setSuccess("Print: connect to your PDF + print flow.");
    const onPrintPreview = () => setSuccess("Print Preview: PDF version loading...");

    if (!mounted) return <div className="min-h-screen" />;

    return (
        <div className="space-y-6" onPaste={handlePaste}>
            <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4">
                    <Button
                        onClick={() => router.push("/purchase")}
                        className="rounded-full h-10 px-4 bg-white text-slate-900 border border-slate-200 hover:!bg-orange-600 hover:!text-white hover:!border-orange-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Registry
                    </Button>
                </div>

                <PageHeader
                    icon={ShoppingBag}
                    title={searchParams.get("id") ? (isEditMode ? "Edit Purchase Invoice" : "View Purchase Invoice") : "Create New Purchase Invoice"}
                    description={
                        searchParams.get("id")
                            ? `${voucherStatus ? `Status: ${voucherStatus.charAt(0).toUpperCase() + voucherStatus.slice(1)}. ` : ""}${isEditMode ? "Modify the details below." : "Click Edit to modify this invoice."}`
                            : "Fill in the details below to record a new purchase."
                    }
                    actions={
                        !isEditMode && searchParams.get("id") ? (
                            <Button
                                onClick={() => setIsEditMode(true)}
                                className="rounded-full h-10 px-8 bg-white text-slate-900 border border-slate-200 hover:!bg-orange-600 hover:!text-white hover:!border-orange-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95"
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 0 002 2h11a2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </Button>
                        ) : undefined
                    }
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

                {/* Top area */}
                <section className="relative mb-6">
                    <div className="absolute right-0 top-0 hidden w-[260px] flex-col gap-3 lg:flex">
                        <DualDateInput
                            ref={purchaseDateRef}
                            label="Purchase Date"
                            value={form.purchaseDate}
                            accentColor="bg-orange-600"
                            onChange={(next) => setForm((f) => ({ ...f, purchaseDate: next }))}
                            onEnterNext={() => safeFocus(vendorInvoiceDateRef.current)}
                            disabled={true}
                        />
                        <DualDateInput
                            ref={vendorInvoiceDateRef}
                            label="Vendor Invoice Date"
                            value={form.vendorInvoiceDate}
                            accentColor="bg-orange-600"
                            onChange={(next) => setForm((f) => ({ ...f, vendorInvoiceDate: next }))}
                            onEnterNext={() => safeFocus(vendorInvoiceNoRef.current)}
                            disabled={!isEditMode}
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12 lg:pr-[300px]">
                        <div className="lg:col-span-4 space-y-3">
                            <label className="space-y-1 text-sm">
                                <span className="text-xs text-muted-foreground">Invoice No.</span>
                                <Input
                                    ref={invoiceNoRef}
                                    value={form.referenceNo}
                                    onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                                    placeholder="Reference No."
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                    disabled={true}
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span className="text-xs text-muted-foreground">Vendor Invoice No. <span className="text-red-500">*</span></span>
                                <Input
                                    ref={vendorInvoiceNoRef}
                                    value={form.vendorInvoiceNo}
                                    onChange={(e) => setForm((f) => ({ ...f, vendorInvoiceNo: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            safeFocus(paymentMethodRef.current);
                                        }
                                    }}
                                    placeholder="Enter physical invoice number"
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
                                            "h-11 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700",
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
                                            className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 h-7 rounded-full px-3 text-[10px] bg-orange-600 text-white border-none hover:bg-orange-700 shadow-sm transition-all active:scale-95"
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
                                                safeFocus(purchaseTypeRef.current);
                                            }
                                        }}
                                        placeholder="Brief description of purchase"
                                        className="mt-2 h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-zinc-700"
                                        disabled={!isEditMode}
                                    />
                                </div>

                                <div className="mt-4">
                                    <div className="text-xs text-muted-foreground">Purchase Type <span className="text-red-500">*</span></div>
                                    <div className="relative">
                                        <SearchableSelect
                                            buttonRef={purchaseTypeRef}
                                            placeholder="Select purchase type…"
                                            valueId={form.purchaseTypeId}
                                            onChange={(id, opt) => setForm((f) => ({ ...f, purchaseTypeId: id, purchaseType: opt?.name }))}
                                            options={purchaseTypes}
                                            className="mt-2"
                                            buttonClassName={cn(
                                                "h-11 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700",
                                                (!form.purchaseTypeId && isEditMode) ? "pr-[80px]" : "pr-4"
                                            )}
                                            disabled={!isEditMode}
                                            onEnterNext={() => safeFocus(vendorSelectRef.current)}
                                            onAdd={() => setAddPurchaseTypeOpen(true)}
                                        />
                                        {!form.purchaseTypeId && isEditMode && (
                                            <Button
                                                type="button"
                                                onClick={() => setAddPurchaseTypeOpen(true)}
                                                className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 h-7 rounded-full px-3 text-[10px] bg-orange-600 text-white border-none hover:bg-orange-700 shadow-sm transition-all active:scale-95"
                                            >
                                                <Plus className="mr-1.5 h-3 w-3" />
                                                New
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Vendor */}
                <section className="mb-6">
                    <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Vendor</div>
                    <div className="relative max-w-[980px]">
                        <SearchableSelect<PartyRecord>
                            buttonRef={vendorSelectRef}
                            placeholder="Search vendor…"
                            valueId={form.partyId}
                            fallbackLabel={(form as any).partyName}
                            onChange={(id) => setForm((f) => ({ ...f, partyId: id }))}
                            options={parties}
                            getLabel={(p) => p.name}
                            leftIcon={<Search className="h-4 w-4" />}
                            disabled={!isEditMode}
                            buttonClassName="h-12 rounded-2xl bg-white dark:bg-slate-900 pr-[140px]"
                        />

                        {!form.partyId && isEditMode && (
                            <Button
                                type="button"
                                onClick={() => setAddVendorOpen(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full px-4 text-xs bg-orange-600 text-white hover:bg-orange-700 border-none shadow-lg shadow-orange-500/20 transition-all active:scale-95 font-bold uppercase tracking-widest"
                                disabled={!isEditMode}
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                New Vendor
                            </Button>
                        )}
                    </div>
                </section>

                {/* Add Column */}
                {isEditMode && (
                    <div className="mb-3 flex flex-col items-end gap-1.5">
                        <Button
                            ref={addLineButtonRef}
                            type="button"
                            onClick={addLine}
                            className="rounded-full bg-orange-600 text-white hover:bg-orange-700 shadow-sm transition-all active:scale-95 border-none h-10 px-6 text-xs font-bold uppercase tracking-widest"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Column
                        </Button>
                    </div>
                )}

                {/* Items Details */}
                <section className="mb-8 rounded-3xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Items Details</div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/30">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-100/70 dark:bg-slate-900/40">
                                    <tr>
                                        <th className="w-[60px] px-4 py-3 text-left text-xs text-muted-foreground">S.No.</th>
                                        <th className="w-[400px] min-w-[300px] px-4 py-3 text-left text-xs text-muted-foreground">Particulars</th>
                                        <th className="w-[120px] px-4 py-3 text-left text-xs text-muted-foreground">Qty <span className="text-red-500">*</span></th>
                                        <th className="w-[100px] px-4 py-3 text-left text-xs text-muted-foreground">Unit</th>
                                        <th className="w-[140px] px-4 py-3 text-left text-xs text-muted-foreground">Rate <span className="text-red-500">*</span></th>
                                        <th className="w-[140px] px-4 py-3 text-right text-xs text-muted-foreground">Amount</th>
                                        <th className="w-[60px] px-4 py-3 text-right text-xs text-muted-foreground" />
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
                                                                    rate: item?.purchasePrice?.toString() || "",
                                                                    expenseAccountId: item?.expenseAccountId || undefined,
                                                                    unit: item?.unit || "",
                                                                    description: item ? `${item.name}${item.sku ? ` [${item.sku}]` : ""}` : ""
                                                                });
                                                            }}
                                                            options={items}
                                                            getLabel={(it) => `${it.name}${it.sku ? ` [${it.sku}]` : ""}`}
                                                            getDetail={(it) => `${it.sku || it.code ? (it.sku || it.code) + ' | ' : ''}Stock: ${it.stock ?? 0}`}
                                                            onEnterNext={() => safeFocus(rowRefs.current.qty[idx])}
                                                            leftIcon={<Search className="h-4 w-4" />}
                                                            buttonClassName="h-11 rounded-2xl bg-white dark:bg-slate-900 pr-[100px]"
                                                            disabled={!isEditMode}
                                                        />
                                                        {!line.itemId && isEditMode && (
                                                            <Button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveLineIdx(idx);
                                                                    setAddItemOpen(true);
                                                                }}
                                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 rounded-xl px-3 text-[10px] font-medium bg-orange-600 text-white hover:bg-orange-700 border-none shadow-sm transition-all active:scale-95"
                                                                disabled={!isEditMode}
                                                            >
                                                                <Plus className="mr-1 h-3 w-3" />
                                                                Add item
                                                            </Button>
                                                        )}
                                                        {line.description && (
                                                            <input
                                                                className="mt-1 w-full bg-transparent text-xs text-slate-500 placeholder:text-slate-300 outline-none"
                                                                placeholder="Custom description..."
                                                                value={line.description}
                                                                onChange={(e) => updateLine(idx, { description: e.target.value })}
                                                            />
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
                                                            updateLine(idx, { qty: e.target.value });
                                                            setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], qty: undefined } }));
                                                        }}
                                                        disabled={!isEditMode}
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
                                                                }
                                                            }
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                safeFocus(rowRefs.current.rate[idx]);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "h-11 rounded-2xl bg-white text-center dark:bg-slate-900",
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
                                                        disabled={!isEditMode}
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
                                                                }
                                                            }
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                if (rowRefs.current.select[idx + 1]) {
                                                                    safeFocus(rowRefs.current.select[idx + 1]);
                                                                } else {
                                                                    safeFocus(addLineButtonRef.current);
                                                                }
                                                            }
                                                        }}
                                                        className={cn(
                                                            "h-11 rounded-2xl bg-white text-center dark:bg-slate-900",
                                                            lineErrors[idx]?.rate && "border-red-500 focus:ring-red-200"
                                                        )}
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
                                                    {isEditMode && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLine(idx)}
                                                            disabled={!isEditMode}
                                                            className={cn(
                                                                "inline-flex h-10 w-10 items-center justify-center rounded-xl border text-red-600 hover:bg-red-50",
                                                                (lines.length === 1 || !isEditMode) && "pointer-events-none opacity-50"
                                                            )}
                                                            title="Remove line"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {needsInventoryFields && (
                                                <tr className="border-t border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
                                                    <td />
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="grid gap-3 md:grid-cols-6">
                                                            {inventorySettings?.warehousesEnabled && (
                                                                <select value={line.warehouseId || inventorySettings.defaultWarehouseId || ""} disabled={!isEditMode} onChange={(event) => updateLine(idx, { warehouseId: event.target.value, binId: "" })} className="h-10 rounded-xl border bg-white px-3 text-xs dark:bg-slate-900">
                                                                    <option value="">Warehouse</option>
                                                                    {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                                                                </select>
                                                            )}
                                                            {inventorySettings?.binsEnabled && (
                                                                <select value={line.binId || ""} disabled={!line.warehouseId || !isEditMode} onChange={(event) => updateLine(idx, { binId: event.target.value })} className="h-10 rounded-xl border bg-white px-3 text-xs dark:bg-slate-900">
                                                                    <option value="">Bin</option>
                                                                    {bins.map((bin) => <option key={bin.id} value={bin.id}>{bin.name}</option>)}
                                                                </select>
                                                            )}
                                                            {inventorySettings?.batchTrackingEnabled && <Input value={line.batchNo || ""} onChange={(e) => updateLine(idx, { batchNo: e.target.value })} placeholder={selectedItem?.tracksBatch ? "Batch Number *" : "Batch Number"} className="h-10 rounded-xl text-xs" />}
                                                            {inventorySettings?.lotTrackingEnabled && <Input value={line.lotNo || ""} onChange={(e) => updateLine(idx, { lotNo: e.target.value })} placeholder={selectedItem?.tracksLot ? "Lot Number *" : "Lot Number"} className="h-10 rounded-xl text-xs" />}
                                                            {inventorySettings?.expiryTrackingEnabled && <Input type="date" aria-label="Expiry Date" title="Expiry Date" value={line.expiryDate || ""} onChange={(e) => updateLine(idx, { expiryDate: e.target.value })} className="h-10 rounded-xl text-xs" />}
                                                            {selectedItem?.isSerialized && inventorySettings?.serialTrackingEnabled && (
                                                                <textarea value={line.serialText || ""} onChange={(event) => updateLine(idx, { serialText: event.target.value })} placeholder="Serial numbers" className="min-h-10 rounded-xl border bg-white px-3 py-2 text-xs dark:bg-slate-900 md:col-span-2" />
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
                                        <td />
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
                    {isEditMode && (
                        <Button
                            ref={addSundryButtonRef}
                            type="button"
                            onClick={addSundry}
                            className="rounded-full h-10 px-4 bg-orange-600 hover:bg-orange-700 text-white border-none hover:!bg-orange-600 hover:!text-white hover:!border-orange-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Sundry Column
                        </Button>
                    )}
                </div>

                {/* BILL SUNDRY */}
                <section className="mb-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="mr-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Bill Sundry Details</div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-100/70 dark:bg-slate-900/40">
                                    <tr>
                                        <th className="w-[70px] px-3 py-2 text-left text-xs text-muted-foreground">S.N.</th>
                                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">Bill Sundry</th>
                                        <th className="w-[140px] px-3 py-2 text-right text-xs text-muted-foreground">@</th>
                                        <th className="w-[200px] px-3 py-2 text-right text-xs text-muted-foreground">Amount (Rs.)</th>
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
                                                                safeFocus(notesRef.current);
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
                                                                    safeFocus(notesRef.current);
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
                                                    />
                                                    {!r.sundryId && r.id !== "discount" && r.id !== "vat" && (
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveSundryIdx(i);
                                                                setAddSundryOpen(true);
                                                            }}
                                                            className="absolute z-10 right-7 top-1/2 -translate-y-1/2 h-7 rounded-lg px-1.5 text-[10px] font-medium bg-orange-600 text-white hover:bg-orange-700 border-none shadow-sm transition-all active:scale-95"
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
                                                        ref={(el) => { if (el) sundryRefs.current.rate[i] = el; }}
                                                        type="number"
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
                                                                    safeFocus(notesRef.current);
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
                                                                    safeFocus(notesRef.current);
                                                                    return;
                                                                }
                                                                e.preventDefault();
                                                                if (sundryRefs.current.amount[i]) {
                                                                    safeFocus(sundryRefs.current.amount[i]);
                                                                } else if (sundryRefs.current.select[i + 1]) {
                                                                    safeFocus(sundryRefs.current.select[i + 1]);
                                                                }
                                                            }
                                                        }}
                                                        disabled={r.id === "vat" || !isEditMode}
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
                                                                        safeFocus(notesRef.current);
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
                                                                        safeFocus(notesRef.current);
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
                                                            disabled={!isEditMode || r.id === "vat"}
                                                            className="h-8 w-24 rounded-lg border-slate-200 bg-white px-2 text-right text-sm dark:border-zinc-800 dark:bg-zinc-900/40"
                                                        />
                                                    </div>
                                                    {r.type === "less" ? ")" : null}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeSundry(r.id)}
                                                    disabled={r.id === "vat" || r.id === "discount" || !isEditMode}
                                                    className={cn(
                                                        "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-red-600 hover:bg-red-50",
                                                        (billSundries.length <= 1 || r.id === "vat" || r.id === "discount" || !isEditMode) && "pointer-events-none opacity-50"
                                                    )}
                                                    title="Remove"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    <tr className="border-t bg-slate-50/50 font-bold dark:bg-zinc-900/50">
                                        <td colSpan={3} className="px-3 py-3 text-right text-slate-500">Net Bill Sundry</td>
                                        <td className="px-3 py-3 text-right">
                                            <span className={cn(billSundryComputed.net >= 0 ? "text-emerald-600" : "text-red-600")}>
                                                {billSundryComputed.net < 0 ? "-" : "+"} <MoneyText value={Math.abs(billSundryComputed.net)} />
                                            </span>
                                        </td>
                                        <td />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* BOTTOM SUMMARY ACTIONS */}
                <section className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
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

                            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-zinc-950">
                                <div className="text-sm font-semibold">Total</div>
                                <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                    <MoneyText value={total} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Additional notes</div>
                            <div className="text-xs text-muted-foreground">
                                BS: <span className="font-medium text-foreground">{form.purchaseDate.bs || "—"}</span>{" "}
                                <span className="text-muted-foreground">({form.purchaseDate.ad || "—"})</span>
                            </div>
                        </div>

                        <Input
                            ref={notesRef}
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    const lastSundryIdx = billSundryComputed.rows.length - 1;
                                    safeFocus(sundryRefs.current.rate[lastSundryIdx]);
                                }
                            }}
                            placeholder="Internal record notes..."
                            className="h-11 rounded-2xl bg-slate-50/60 dark:bg-zinc-900 dark:border-zinc-800"
                            disabled={!isEditMode}
                        />

                        <div className="mt-8 flex flex-wrap items-center justify-end gap-2">
                            <Button
                                type="button"
                                onClick={onSave}
                                disabled={loading || sending || !isEditMode}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 bg-orange-600 text-white hover:bg-orange-700 border-none shadow-lg shadow-orange-500/20"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? "Saving..." : "Save Draft"}
                            </Button>

                            <Button
                                onClick={onPost}
                                disabled={loading || sending || !isEditMode}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 shadow-orange-500/25 bg-orange-600 text-white hover:bg-orange-700 border-none"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {sending ? "Posting..." : "Post & Finalize"}
                            </Button>

                            <Button
                                type="button"
                                onClick={onPreview}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 bg-orange-600 text-white hover:bg-orange-700 border-none shadow-md shadow-orange-500/10"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                            </Button>

                            <Button
                                type="button"
                                onClick={onPrint}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 bg-orange-600 text-white hover:bg-orange-700 border-none shadow-md shadow-orange-500/10"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>

                            <Button
                                type="button"
                                onClick={onPrintPreview}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 bg-orange-600 text-white hover:bg-orange-700 border-none shadow-md shadow-orange-500/10"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Print Preview
                            </Button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Dialogs */}
            <AddItemDialog
                open={addItemOpen}
                onClose={() => setAddItemOpen(false)}
                onSuccess={(newItem) => {
                    setItems(prev => [...prev, newItem]);
                    if (activeLineIdx !== null) {
                        updateLine(activeLineIdx, {
                            itemId: newItem.id,
                            rate: newItem.purchasePrice?.toString() || ""
                        });
                        setTimeout(() => safeFocus(rowRefs.current.qty[activeLineIdx]), 50);
                    }
                }}
            />
            <AddVendorDialog
                open={addVendorOpen}
                onClose={() => setAddVendorOpen(false)}
                onSuccess={(newVendor) => {
                    setParties(prev => [...prev, newVendor]);
                    setForm(f => ({ ...f, partyId: newVendor.id }));
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
            <AddPurchaseTypeDialog
                open={addPurchaseTypeOpen}
                onClose={() => setAddPurchaseTypeOpen(false)}
                onSuccess={(st) => {
                    setPurchaseTypes(prev => [...prev, st]);
                    setForm(f => ({ ...f, purchaseTypeId: st.id, purchaseType: st.name }));
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
        </div>
    );
}
