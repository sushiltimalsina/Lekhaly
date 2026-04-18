"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";

import {
    createQuotation,
    updateQuotation,
    getQuotation,
    convertToSalesOrder,
    type QuotationInput
} from "@/lib/api/quotations";

import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listItems, type ItemRecord } from "@/lib/api/items";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddCustomerDialog from "@/components/app/add-customer-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import { listBillSundries, type BillSundryRecord } from "@/lib/api/bill-sundries";
import { useUiState } from "@/lib/store/ui";

import {
    Plus,
    Trash2,
    Save,
    Search,
    ChevronDown,
    Check,
    Printer,
    FileText,
    ChevronRight,
    ArrowLeft,
    RefreshCw,
} from "lucide-react";
import { toBs } from "@/lib/dates/bs";
import { useNavigate, useSearchParams } from "react-router-dom";

// --- Components (SearchableSelect, isoAddDays) ---

const isoAddDays = (iso: string, days: number) => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
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
                                            setOpen(false);
                                            setQuery("");
                                            buttonRef.current?.focus();
                                        } else if (e.key === "ArrowDown") {
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
                                        }
                                        props.onKeyDownCustom?.(e);
                                    }}
                                    placeholder="Type to search…"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950"
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
                                                onChange(o.id, o);
                                                setOpen(false);
                                                setQuery("");
                                                props.onEnterNext?.();
                                            }}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                                                isActive ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                                                isSelected && "text-primary font-medium"
                                            )}
                                        >
                                            <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                                                <span className="truncate">{labelText}</span>
                                                {detailText ? (
                                                    <span className={cn("text-xs whitespace-nowrap", isSelected ? "text-primary/80" : "text-muted-foreground")}>
                                                        {detailText}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
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

// --- Main Page Component ---

type Line = { itemId: string; qty: string; rate: string; description?: string };
type BillSundryRow = { id: string; sundryId?: string; name: string; type: "add" | "less"; ratePct: string; manualAmount?: string; isManual?: boolean };

export default function QuotationCreatePage() {
    const [mounted, setMounted] = React.useState(false);

    const dateRef = React.useRef<HTMLInputElement>(null);
    const expiryDateRef = React.useRef<HTMLInputElement>(null);
    const quotationNoRef = React.useRef<HTMLInputElement>(null);
    const salesTypeRef = React.useRef<HTMLSelectElement>(null);
    const memoRef = React.useRef<HTMLInputElement>(null);
    const referenceNoRef = React.useRef<HTMLInputElement>(null);
    const customerSelectRef = React.useRef<HTMLButtonElement | null>(null);
    const addLineButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const [lineErrors, setLineErrors] = React.useState<Record<number, { qty?: string; rate?: string }>>({});
    const [addItemOpen, setAddItemOpen] = React.useState(false);
    const [activeLineIdx, setActiveLineIdx] = React.useState<number | null>(null);
    const [addCustomerOpen, setAddCustomerOpen] = React.useState(false);
    const [addSundryOpen, setAddSundryOpen] = React.useState(false);
    const [activeSundryIdx, setActiveSundryIdx] = React.useState<number | null>(null);

    // For item table navigation
    const rowRefs = React.useRef<{
        select: (HTMLButtonElement | null)[];
        qty: (HTMLInputElement | null)[];
        rate: (HTMLInputElement | null)[];
    }>({ select: [], qty: [], rate: [] });

    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [items, setItems] = React.useState<ItemRecord[]>([]);
    const [sundryOptions, setSundryOptions] = React.useState<BillSundryRecord[]>([]);

    const safeFocus = (el: HTMLElement | null) => {
        if (!el) return;
        el.focus({ preventScroll: true });
    };

    React.useEffect(() => {
        if (mounted) {
            setTimeout(() => safeFocus(dateRef.current), 100);
        }
    }, [mounted]);

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        partyId: "",
        quotationDate: { bs: "", ad: "" },
        expiryDate: { bs: "", ad: "" },
        quotationNoDisplay: "System generated",
        referenceNo: "",
        salesType: "vat_13" as any,
        memo: "",
        notes: "",
        terms: "",
        partyName: "",
        orderNo: ""
    });

    const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "", rate: "" }]);

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

    React.useEffect(() => setMounted(true), []);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isEditMode, setIsEditMode] = React.useState(true);
    const [quotationStatus, setQuotationStatus] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (searchParams.get("id")) return;
        const now = new Date();
        const ad = now.toISOString().slice(0, 10);
        const bs = toBs(ad);
        const expAd = isoAddDays(ad, 30);
        const expBs = toBs(expAd);

        setForm((f) => ({
            ...f,
            quotationDate: { bs, ad },
            expiryDate: { bs: expBs, ad: expAd },
        }));
    }, [searchParams]);

    React.useEffect(() => {
        let alive = true;

        const normalizeList = <T,>(input: unknown): T[] => {
            if (Array.isArray(input)) return input as T[];
            const obj = input as { items?: T[]; data?: T[] } | null;
            return obj?.items ?? obj?.data ?? [];
        };

        Promise.all([
            listParties({ type: "customer", take: 200 }),
            listItems({ take: 200 }),
            listBillSundries({ take: 100 })
        ])
            .then(([p, i, s]) => {
                if (!alive) return;
                setParties(normalizeList<PartyRecord>(p));
                setItems(normalizeList<ItemRecord>(i));
                const opts = normalizeList<BillSundryRecord>(s);
                setSundryOptions(opts);

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
                    getQuotation(editId).then(qt => {
                        setQuotationStatus(qt.status || null);
                        const parseDate = (d: any) => {
                            if (!d) return "";
                            if (typeof d === "string") return d.split("T")[0];
                            if (d instanceof Date) return d.toISOString().split("T")[0];
                            return String(d).split("T")[0];
                        };

                        setForm(f => ({
                            ...f,
                            partyId: qt.partyId || "",
                            quotationDate: { ad: parseDate(qt.date), bs: qt.dateBs || "" },
                            expiryDate: { ad: parseDate(qt.expiryDate), bs: qt.expiryDateBs || "" },
                            quotationNoDisplay: qt.quotationNo || "System generated",
                            referenceNo: qt.referenceNo || "",
                            memo: qt.memo || "",
                            notes: qt.additionalNote || "",
                            partyName: qt.party?.name || "",
                            terms: qt.terms || "",
                        }));

                        if (qt.items && qt.items.length > 0) {
                            setLines(qt.items.map((it: any) => ({
                                itemId: it.itemId,
                                qty: String(Number(it.qty || 0)),
                                rate: String(Number(it.rate || 0)),
                                description: it.description || ""
                            })));
                        }

                        if (qt.sundries && qt.sundries.length > 0) {
                            setBillSundries(qt.sundries.map((sn: any) => ({
                                id: Math.random().toString(36).substr(2, 9),
                                sundryId: sn.billSundryId,
                                name: sn.name,
                                type: sn.type,
                                ratePct: String(sn.rate || "0"),
                                manualAmount: String(sn.amount || "0"),
                                isManual: true
                            })));
                        }
                    }).catch(err => console.error("Failed to load quotation", err));
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

    const total = itemsSubtotal + billSundryComputed.net;

    const updateLine = (idx: number, patch: Partial<Line>) =>
        setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

    const [pendingFocusIndex, setPendingFocusIndex] = React.useState<number | null>(null);

    const addLine = () => {
        setLines((prev) => {
            setPendingFocusIndex(prev.length);
            return [...prev, { itemId: "", qty: "", rate: "" }];
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

    const buildPayload = (): QuotationInput => {
        if (!form.partyId) {
            throw new Error("Customer is required.");
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

                return {
                    itemId: l.itemId,
                    qty,
                    rate,
                    description: l.description || undefined,
                };
            });

        if (!payloadItems.length) throw new Error("Add at least one item line.");

        return {
            partyId: form.partyId,
            quotationDate: form.quotationDate.ad || undefined,
            quotationDateBs: form.quotationDate.bs || undefined,
            expiryDate: form.expiryDate.ad || undefined,
            expiryDateBs: form.expiryDate.bs || undefined,
            memo: form.memo || undefined,
            notes: form.notes || undefined,
            referenceNo: form.referenceNo || undefined,
            terms: form.terms || undefined,
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
                res = await updateQuotation(editId, buildPayload());
            } else {
                res = await createQuotation(buildPayload());
            }
            const id = res?.id ?? res?.data?.id;
            setSuccess(id ? `Saved quotation: ${res?.quotationNo || id}` : "Saved quotation.");
            if (!editId && id) {
                navigate(`/quotations/create?id=${id}`, { replace: true });
            }
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const onConvertToOrder = async () => {
        if (!searchParams.get("id")) return;
        setLoading(true);
        try {
            const res = await convertToSalesOrder(searchParams.get("id")!);
            // Assuming res contains the new sales order ID
            const newOrderId = res?.id || res?.data?.id;
            if (newOrderId) {
                setSuccess("Converted to Sales Order successfully.");
                setTimeout(() => navigate(`/sales-orders/create?id=${newOrderId}`), 1000);
            } else {
                setSuccess("Converted to Sales Order.");
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to convert.");
        } finally {
            setLoading(false);
        }
    };

    const onPrint = () => setSuccess("Print: connect to your PDF + print flow.");

    if (!mounted) return <div className="min-h-screen" />;

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/quotations")}
                        className="rounded-full h-10 px-4 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Registry
                    </Button>
                </div>
                <PageHeader
                    title={searchParams.get("id") ? (isEditMode ? "Edit Quotation" : "View Quotation") : "Create New Quotation"}
                    description={
                        searchParams.get("id")
                            ? `${quotationStatus ? `Status: ${quotationStatus.charAt(0).toUpperCase() + quotationStatus.slice(1)}. ` : ""}${isEditMode ? "Modify the details below." : "Click Edit to modify this quotation."}`
                            : "Fill in the details below to create a new quotation."
                    }
                    actions={
                        <div className="flex gap-2">
                            {/* Convert Action */}
                            {!isEditMode && searchParams.get("id") && (
                                <Button
                                    onClick={onConvertToOrder}
                                    className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg h-10 px-4"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Convert to Order
                                </Button>
                            )}

                            {!isEditMode && searchParams.get("id") ? (
                                <Button
                                    onClick={() => setIsEditMode(true)}
                                    className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 h-10 px-6 font-black text-xs uppercase tracking-widest transition-all active:scale-95 border-none"
                                >
                                    Edit
                                </Button>
                            ) : undefined}
                        </div>
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
                        <div className="rounded-xl border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm text-green-700">
                            {success}
                        </div>
                    ) : null}
                </div>

                {/* Form Body */}
                <div className={cn("grid gap-8", !isEditMode && "pointer-events-none opacity-90")}>
                    {/* Top Row: Customer & Meta */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Customer */}
                        <div className="space-y-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    Customer
                                </label>
                                {isEditMode && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAddCustomerOpen(true)}
                                        className="h-7 rounded-lg px-2 text-xs"
                                    >
                                        <Plus className="mr-1 h-3 w-3" /> New
                                    </Button>
                                )}
                            </div>
                            <SearchableSelect
                                placeholder="Select Customer"
                                valueId={form.partyId}
                                onChange={(id, opt) => setForm((f) => ({ ...f, partyId: id, partyName: opt?.name || "" }))}
                                options={parties}
                                getLabel={(p) => p.name}
                                getDetail={(p) => p.pan ? `PAN: ${p.pan}` : p.mobile || ""}
                                buttonRef={customerSelectRef}
                                onEnterNext={() => {
                                    // Maybe jump to date
                                }}
                            />
                        </div>

                        {/* Dates & No */}
                        <div className="col-span-1 space-y-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50 lg:col-span-2">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Quotation Date</label>
                                    <div className="flex bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <input
                                            ref={dateRef}
                                            type="date"
                                            className="w-full border-none bg-transparent px-3 py-2 text-sm outline-none"
                                            value={form.quotationDate.ad}
                                            onChange={(e) => {
                                                const ad = e.target.value;
                                                setForm(f => ({ ...f, quotationDate: { ad, bs: toBs(ad) } }));
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") expiryDateRef.current?.focus();
                                            }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-slate-400 px-1">
                                        BS: {form.quotationDate.bs || "-"}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Valid Until</label>
                                    <div className="flex bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <input
                                            ref={expiryDateRef}
                                            type="date"
                                            className="w-full border-none bg-transparent px-3 py-2 text-sm outline-none"
                                            value={form.expiryDate.ad}
                                            onChange={(e) => {
                                                const ad = e.target.value;
                                                setForm(f => ({ ...f, expiryDate: { ad, bs: toBs(ad) } }));
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") referenceNoRef.current?.focus();
                                            }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-slate-400 px-1">
                                        BS: {form.expiryDate.bs || "-"}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Quotation No.</label>
                                    <Input
                                        ref={quotationNoRef}
                                        value={form.quotationNoDisplay}
                                        readOnly
                                        className="bg-slate-100 text-slate-500"
                                        tabIndex={-1}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Reference No.</label>
                                    <Input
                                        ref={referenceNoRef}
                                        value={form.referenceNo}
                                        onChange={(e) => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                                        placeholder="Optional ref..."
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") memoRef.current?.focus();
                                        }}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Memo / Subject</label>
                                    <Input
                                        ref={memoRef}
                                        value={form.memo}
                                        onChange={(e) => setForm(f => ({ ...f, memo: e.target.value }))}
                                        placeholder="Project X..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Type (Hidden logic or explicit) - For Quotations we might default to taxable but allow exempt */}
                    {/* Items Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/20">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Items</h3>
                            {isEditMode && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setAddItemOpen(true)} className="h-8">
                                        <Plus className="mr-2 h-3.5 w-3.5" />
                                        New Item
                                    </Button>
                                    <Button size="sm" onClick={addLine} ref={addLineButtonRef} className="h-8">
                                        Add Line (Alt+A)
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-medium text-slate-500 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 w-16">#</th>
                                        <th className="px-4 py-3 min-w-[200px]">Item Description</th>
                                        <th className="px-4 py-3 w-24 text-right">Qty</th>
                                        <th className="px-4 py-3 w-32 text-right">Rate</th>
                                        <th className="px-4 py-3 w-32 text-right">Amount</th>
                                        {isEditMode && <th className="px-4 py-3 w-12"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {lines.map((line, idx) => {
                                        const amount = Number(line.qty || 0) * Number(line.rate || 0);
                                        return (
                                            <tr key={idx} className="group hover:bg-slate-50/50">
                                                <td className="px-4 py-2 text-xs text-slate-400 font-mono">{idx + 1}</td>
                                                <td className="px-4 py-2">
                                                    <SearchableSelect
                                                        valueId={line.itemId}
                                                        onChange={(id, opt) => {
                                                            updateLine(idx, {
                                                                itemId: id,
                                                                rate: opt?.salesPrice ? String(opt.salesPrice) : line.rate,
                                                                description: opt?.name
                                                            });
                                                        }}
                                                        options={items}
                                                        getLabel={(i) => i.name}
                                                        getDetail={(i) => i.code ? `Code: ${i.code}` : `Stock: ${i.stock ?? 0}`}
                                                        placeholder="Select Item..."
                                                        className="w-full min-w-[200px]"
                                                        buttonClassName="h-9 border-transparent bg-transparent hover:bg-white focus:bg-white focus:ring-2 px-2 shadow-none"
                                                        buttonRef={(el) => { rowRefs.current.select[idx] = el; }}
                                                        onEnterNext={() => rowRefs.current.qty[idx]?.focus()}
                                                    />
                                                    {line.description && (
                                                        <input
                                                            className="mt-1 w-full bg-transparent text-xs text-slate-500 placeholder:text-slate-300 outline-none"
                                                            placeholder="Custom description..."
                                                            value={line.description}
                                                            onChange={(e) => updateLine(idx, { description: e.target.value })}
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        ref={(el) => { rowRefs.current.qty[idx] = el; }}
                                                        className="w-full text-right bg-transparent p-1 outline-none focus:bg-slate-100 rounded"
                                                        value={line.qty}
                                                        onChange={(e) => updateLine(idx, { qty: e.target.value })}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") rowRefs.current.rate[idx]?.focus();
                                                        }}
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        ref={(el) => { rowRefs.current.rate[idx] = el; }}
                                                        className="w-full text-right bg-transparent p-1 outline-none focus:bg-slate-100 rounded"
                                                        value={line.rate}
                                                        onChange={(e) => updateLine(idx, { rate: e.target.value })}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                if (idx === lines.length - 1) addLine();
                                                                else rowRefs.current.select[idx + 1]?.focus();
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium tabular-nums">
                                                    {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                {isEditMode && (
                                                    <td className="px-4 py-2 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                            onClick={() => removeLine(idx)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-50/50 font-medium">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-right text-slate-500">Total Items:</td>
                                        <td className="px-4 py-3 text-right">{lines.reduce((s, l) => s + Number(l.qty || 0), 0)}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">
                                            {itemsSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Bottom: Totals & Terms */}
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Terms */}
                        <div className="space-y-4">
                            <label className="text-sm font-semibold">Terms & Conditions</label>
                            <textarea
                                className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900/50"
                                placeholder="Payment terms, delivery details..."
                                value={form.terms}
                                onChange={(e) => setForm(f => ({ ...f, terms: e.target.value }))}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Private Note (Internal)</label>
                                <Input
                                    value={form.notes}
                                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Internal use only..."
                                />
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="space-y-4 rounded-2xl bg-slate-50 p-6 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Bill Sundries</h3>
                                {isEditMode && (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => setAddSundryOpen(true)} className="h-7 text-xs">
                                            <Plus className="mr-1 h-3 w-3" /> New
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={addSundry} className="h-7 text-xs">
                                            Add Row
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {billSundries.map((row, idx) => (
                                    <div key={row.id} className="flex items-center gap-2 group">
                                        <div className="flex-1">
                                            {/* Could be select if generic */}
                                            <Input
                                                value={row.name}
                                                onChange={(e) => updateSundry(row.id, { name: e.target.value })}
                                                className="h-8 bg-white dark:bg-slate-900"
                                                readOnly={!isEditMode || row.id === "vat"} // Lock VAT/Discount names if desired
                                            />
                                        </div>
                                        <div className="w-20">
                                            <Input
                                                value={row.ratePct}
                                                onChange={(e) => updateSundry(row.id, { ratePct: e.target.value, isManual: false })}
                                                className="h-8 text-right bg-white dark:bg-slate-900"
                                                placeholder="%"
                                            />
                                        </div>
                                        <div className="w-28 text-right font-mono text-sm">
                                            {isEditMode ? (
                                                <Input
                                                    value={row.isManual ? row.manualAmount : ((Number(row.ratePct || 0) * itemsSubtotal) / 100).toFixed(2)}
                                                    onChange={(e) => updateSundry(row.id, { manualAmount: e.target.value, isManual: true })}
                                                    className="h-8 text-right bg-white dark:bg-slate-900"
                                                />
                                            ) : (
                                                ((itemsSubtotal * Number(row.ratePct || 0)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                            )}
                                        </div>
                                        {isEditMode && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => removeSundry(row.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                                <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                                    <span>Total Amount</span>
                                    <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                    <MoneyText value={total} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {isEditMode && (
                    <div className="mt-8 flex items-center justify-end gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button onClick={onSave} disabled={loading} className="rounded-xl px-8">
                            {loading ? "Saving..." : "Save Quotation"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <AddCustomerDialog
                open={addCustomerOpen}
                onClose={() => setAddCustomerOpen(false)}
                onSuccess={(party) => {
                    setParties((prev) => [...prev, party]);
                    setForm((f) => ({ ...f, partyId: party.id, partyName: party.name }));
                    setAddCustomerOpen(false);
                }}
            />
            <AddItemDialog
                open={addItemOpen}
                onClose={() => setAddItemOpen(false)}
                onSuccess={(item) => {
                    setItems((prev) => [...prev, item]);
                    setAddItemOpen(false);
                }}
            />
            <AddBillSundryDialog
                open={addSundryOpen}
                onClose={() => setAddSundryOpen(false)}
                onSuccess={(bs) => {
                    setSundryOptions((prev) => [...prev, bs]);
                    setAddSundryOpen(false);
                    // Add directly to rows
                    setBillSundries(prev => [...prev, {
                        id: crypto.randomUUID(),
                        sundryId: bs.id,
                        name: bs.name,
                        type: bs.type as any,
                        ratePct: bs.rate?.toString() || "0"
                    }]);
                }}
            />
        </div>
    );
}


