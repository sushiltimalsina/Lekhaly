"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";

import { createQuotation } from "@/lib/api/quotations";
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
    Send,
    Search,
    ChevronDown,
    ChevronRight,
    Check,
    Package,
    ArrowLeft,
    Eye,
    Printer,
    FileText,
} from "lucide-react";
import Link from "next/link";
import { toBs } from "@/lib/dates/bs";
import { useRouter } from "next/navigation";

type Line = { itemId: string; qty: string; rate: string; description?: string };
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
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950"
                                />
                            </div>
                        </div>

                        <div ref={listRef} className="max-h-64 overflow-auto p-1">
                            {filtered.length ? (
                                filtered.map((o, idx) => {
                                    const labelText = getLabel ? getLabel(o) : o.name ?? o.id;
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
                                                setTimeout(() => {
                                                    if (props.onEnterNext) props.onEnterNext();
                                                    else buttonRef.current?.focus({ preventScroll: true });
                                                }, 10);
                                            }}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                                                isActive ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                                                isSelected && "text-primary font-medium"
                                            )}
                                        >
                                            <span className="min-w-0 flex-1 truncate">{labelText}</span>
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

function isoAddDays(iso: string, days: number) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export default function CreateQuotationPage() {
    const ui = useUiState();
    const router = useRouter();
    const [mounted, setMounted] = React.useState(false);

    const quotationDateRef = React.useRef<HTMLInputElement>(null);
    const expiryDateRef = React.useRef<HTMLInputElement>(null);
    const quotationNoRef = React.useRef<HTMLInputElement>(null);
    const referenceNoRef = React.useRef<HTMLInputElement>(null);
    const salesTypeRef = React.useRef<HTMLSelectElement>(null);
    const memoRef = React.useRef<HTMLInputElement>(null);
    const customerSelectRef = React.useRef<HTMLButtonElement>(null);
    const addLineButtonRef = React.useRef<HTMLButtonElement>(null);
    const [lineErrors, setLineErrors] = React.useState<Record<number, { qty?: string; rate?: string }>>({});
    const [addItemOpen, setAddItemOpen] = React.useState(false);
    const [activeLineIdx, setActiveLineIdx] = React.useState<number | null>(null);
    const [addCustomerOpen, setAddCustomerOpen] = React.useState(false);
    const [addSundryOpen, setAddSundryOpen] = React.useState(false);
    const [activeSundryIdx, setActiveSundryIdx] = React.useState<number | null>(null);

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

    const addSundryButtonRef = React.useRef<HTMLButtonElement>(null);
    const termsRef = React.useRef<HTMLTextAreaElement>(null);
    const notesRef = React.useRef<HTMLTextAreaElement>(null);

    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [items, setItems] = React.useState<ItemRecord[]>([]);
    const [sundryOptions, setSundryOptions] = React.useState<BillSundryRecord[]>([]);

    const safeFocus = (el: HTMLElement | null) => {
        if (!el) return;
        el.focus({ preventScroll: true });
    };

    React.useEffect(() => {
        if (mounted) {
            setTimeout(() => safeFocus(quotationDateRef.current), 100);
        }
    }, [mounted]);

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        quotationNoDisplay: "",
        partyId: "",
        quotationDate: { bs: "", ad: "" },
        expiryDate: { bs: "", ad: "" },
        referenceNo: "",
        salesType: "vat_13" as any,
        memo: "",
        notes: "",
        termsOverrideEnabled: false,
        termsText: "",
    });

    const [showTerms, setShowTerms] = React.useState(false);

    const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "", rate: "" }]);

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

    React.useEffect(() => {
        const now = new Date();
        const ad = now.toISOString().slice(0, 10);
        const bs = toBs(ad);
        const expiryAd = isoAddDays(ad, 30);
        const expiryBs = toBs(expiryAd);

        setForm((f) => ({
            ...f,
            quotationDate: { bs, ad },
            expiryDate: { bs: expiryBs, ad: expiryAd },
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
            listItems({ take: 500 }),
            listBillSundries({ take: 100 })
        ])
            .then(([p, i, s]) => {
                if (!alive) return;
                setParties(normalizeList<PartyRecord>(p));
                setItems(normalizeList<ItemRecord>(i));
                const opts = normalizeList<BillSundryRecord>(s);
                setSundryOptions(opts);

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

    const buildPayload = () => {
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
            referenceNo: form.referenceNo || undefined,
            salesType: form.salesType,
            memo: form.memo || undefined,
            notes: form.notes || undefined,
            terms: (form.termsOverrideEnabled ? form.termsText : undefined) || undefined,
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
            const res: any = await createQuotation(buildPayload());
            const id = res?.id ?? res?.quotationId ?? res?.data?.id;
            setSuccess(id ? `Quotation created: ${id}` : "Quotation created successfully.");
            setTimeout(() => router.push("/quotations"), 1500);
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const onPreview = () => setSuccess("Preview: connect to your quotation preview route/API.");
    const onPrint = () => setSuccess("Print: connect to your PDF + print flow.");
    const onPrintPreview = () => setSuccess("Print Preview: PDF version loading...");

    if (!mounted) return <div className="min-h-screen" />;

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between mb-6">
                    <PageHeader
                        title="Create Quotation"
                        description="Professional estimates and quotations for your customers."
                    />
                    <Link href="/quotations">
                        <Button variant="outline" className="rounded-2xl">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Quotations
                        </Button>
                    </Link>
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
                            ref={quotationDateRef}
                            label="Quotation Date"
                            value={form.quotationDate}
                            accentColor="bg-indigo-600"
                            onChange={(next) => setForm((f) => ({ ...f, quotationDate: next }))}
                            onEnterNext={() => safeFocus(expiryDateRef.current)}
                        />
                        <DualDateInput
                            ref={expiryDateRef}
                            label="Expiry Date"
                            value={form.expiryDate}
                            accentColor="bg-indigo-600"
                            onChange={(next) => setForm((f) => ({ ...f, expiryDate: next }))}
                            onEnterNext={() => safeFocus(quotationNoRef.current)}
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12 lg:pr-[300px]">
                        <div className="lg:col-span-4 space-y-4">
                            <label className="space-y-1 text-sm block">
                                <span className="text-xs text-muted-foreground">Quotation No.</span>
                                <Input
                                    ref={quotationNoRef}
                                    value={form.quotationNoDisplay}
                                    onChange={(e) => setForm((f) => ({ ...f, quotationNoDisplay: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            safeFocus(referenceNoRef.current);
                                        }
                                    }}
                                    placeholder="System generated"
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 font-medium"
                                />
                            </label>

                            <label className="space-y-1 text-sm block">
                                <span className="text-xs text-muted-foreground">Reference No.</span>
                                <Input
                                    ref={referenceNoRef}
                                    value={form.referenceNo}
                                    onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            safeFocus(salesTypeRef.current);
                                        }
                                    }}
                                    placeholder="Internal ref (optional)"
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                />
                            </label>
                        </div>

                        <div className="lg:col-span-8 flex items-start lg:justify-center">
                            <div className="w-full max-w-[520px]">
                                <div className="text-xs text-muted-foreground">Sales Type <span className="text-red-500">*</span></div>
                                <select
                                    ref={salesTypeRef}
                                    value={form.salesType}
                                    onChange={(e) => setForm((f) => ({ ...f, salesType: e.target.value as any }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            safeFocus(memoRef.current);
                                        }
                                    }}
                                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <option value="vat_13">VAT 13% Quote</option>
                                    <option value="exempt">Exempt Quote</option>
                                    <option value="export">Export Quote</option>
                                </select>

                                <div className="mt-4">
                                    <div className="text-xs text-muted-foreground">Memo / Remarks</div>
                                    <Input
                                        ref={memoRef}
                                        value={form.memo}
                                        onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                safeFocus(customerSelectRef.current);
                                            }
                                        }}
                                        placeholder="Brief internal note"
                                        className="mt-2 h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 lg:hidden sm:grid-cols-2">
                            <DualDateInput
                                label="Quotation Date"
                                value={form.quotationDate}
                                accentColor="bg-indigo-600"
                                onChange={(next) => setForm((f) => ({ ...f, quotationDate: next }))}
                            />
                            <DualDateInput
                                label="Expiry Date"
                                value={form.expiryDate}
                                accentColor="bg-indigo-600"
                                onChange={(next) => setForm((f) => ({ ...f, expiryDate: next }))}
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
                                    safeFocus(sundryRefs.current.rate[0]);
                                }
                            }}
                            buttonClassName="h-12 rounded-2xl bg-white dark:bg-slate-900 pr-[140px]"
                        />

                        {!form.partyId && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddCustomerOpen(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 rounded-full px-4 text-xs"
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                New Customer
                            </Button>
                        )}
                    </div>
                </section>

                {/* Add Line Button */}
                <div className="mb-3 flex flex-col items-end gap-1.5">
                    <Button
                        ref={addLineButtonRef}
                        type="button"
                        onClick={addLine}
                        className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item Line
                    </Button>
                </div>

                {/* Items Table */}
                <section className="mb-8 rounded-3xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Quotation Items</div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/30">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-100/70 dark:bg-slate-900/40">
                                    <tr>
                                        <th className="w-[60px] px-4 py-3 text-left text-xs text-muted-foreground">S.No.</th>
                                        <th className="w-[520px] min-w-[420px] px-4 py-3 text-left text-xs text-muted-foreground">Item</th>
                                        <th className="w-[140px] px-4 py-3 text-left text-xs text-muted-foreground">
                                            Qty <span className="text-red-500">*</span>
                                        </th>
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

                                        return (
                                            <tr key={idx} className="border-t border-slate-200/70 dark:border-slate-800/60">
                                                <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    <div className="relative">
                                                        <SearchableSelect<ItemRecord>
                                                            buttonRef={(el) => { rowRefs.current.select[idx] = el; }}
                                                            placeholder="Search item…"
                                                            valueId={line.itemId}
                                                            onChange={(id) => updateLine(idx, { itemId: id })}
                                                            options={items}
                                                            getLabel={(it) => {
                                                                const code = it.hsCode ? ` (${it.hsCode})` : "";
                                                                return `${it.name ?? "Item"}${code}`;
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
                                                            buttonClassName="h-11 rounded-2xl bg-white dark:bg-slate-900 pr-[100px]"
                                                            emptyText="No items found"
                                                        />
                                                        {!line.itemId && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setActiveLineIdx(idx);
                                                                    setAddItemOpen(true);
                                                                }}
                                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 rounded-xl px-3 text-[10px] font-medium bg-slate-50 dark:bg-slate-800"
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
                                                            updateLine(idx, { qty: e.target.value });
                                                            setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], qty: undefined } }));
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
                                                        className={cn(
                                                            "h-11 rounded-2xl bg-white text-center dark:bg-slate-900 transition-colors",
                                                            lineErrors[idx]?.qty && "border-red-500 focus:ring-red-200"
                                                        )}
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
                                                        className={cn(
                                                            "h-11 rounded-2xl bg-white text-center dark:bg-slate-900 transition-colors",
                                                            lineErrors[idx]?.rate && "border-red-500 focus:ring-red-200"
                                                        )}
                                                    />
                                                </td>

                                                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                    <MoneyText value={amt} />
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    {lines.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLine(idx)}
                                                            className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Summary Section */}
                <div className="mb-4 flex flex-col items-end gap-2 text-right">
                    <Button ref={addSundryButtonRef} type="button" variant="outline" onClick={addSundry} className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Adjustment
                    </Button>
                </div>

                {/* BILL SUNDRY */}
                <section className="mb-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="mr-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Bill Sundry Adjustments</div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-100/70 dark:bg-slate-900/40">
                                    <tr>
                                        <th className="w-[70px] px-3 py-2 text-left text-xs text-muted-foreground">S.N.</th>
                                        <th className="px-3 py-2 text-left text-xs text-muted-foreground">Description</th>
                                        <th className="w-[140px] px-3 py-2 text-right text-xs text-muted-foreground">Rate (%)</th>
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
                                                        placeholder="Search adjustment…"
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
                                                        emptyText="No adjustments found"
                                                        disabled={r.id === "vat" || r.id === "discount"}
                                                    />
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
                                                            placeholder="0.00"
                                                            disabled={r.id === "vat"}
                                                            className="h-9 w-28 rounded-xl border-slate-200 bg-white px-2 text-right text-sm dark:border-slate-800 dark:bg-slate-900"
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

                <section className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-3 text-sm font-semibold">Quotation Total</div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/30">
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Items Subtotal</span>
                                    <div className="font-medium tabular-nums">
                                        <MoneyText value={itemsSubtotal} />
                                    </div>
                                </div>

                                {billSundryComputed.rows.map((row) => (
                                    <div key={row.id} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{row.name}</span>
                                        <div className="font-medium tabular-nums">
                                            {row.type === "less" && "- "}
                                            <MoneyText value={row.amount} />
                                        </div>
                                    </div>
                                ))}

                                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                                <div className="flex items-center justify-between">
                                    <span className="font-black text-slate-900 dark:text-white uppercase text-sm">Grand Total</span>
                                    <div className="font-black text-2xl tabular-nums text-indigo-600 dark:text-indigo-400">
                                        <MoneyText value={total} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Additional Notes
                        </div>
                        <textarea
                            ref={notesRef}
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            placeholder="Add overall remarks or notes for this quotation..."
                            className="min-h-[120px] w-full rounded-2xl border-2 border-slate-100 bg-slate-50/30 p-5 text-sm outline-none ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:ring-4 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 transition-all font-medium leading-relaxed"
                        />
                    </div>
                </section>

                {/* TERMS & CONDITIONS */}
                <section className="mt-8 mb-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <button type="button" onClick={() => setShowTerms((v) => !v)} className="flex w-full items-center gap-3">
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showTerms && "rotate-90")} />
                        <div className="text-sm font-semibold">Terms & Conditions</div>
                    </button>

                    {showTerms && (
                        <div className="mt-4 grid gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.termsOverrideEnabled}
                                    onChange={(e) => setForm((f) => ({ ...f, termsOverrideEnabled: e.target.checked }))}
                                />
                                <span>Override company default terms</span>
                            </label>

                            <textarea
                                ref={termsRef}
                                value={form.termsText}
                                onChange={(e) => setForm((f) => ({ ...f, termsText: e.target.value }))}
                                disabled={!form.termsOverrideEnabled}
                                placeholder="Enter custom terms and conditions for this quotation..."
                                className={cn(
                                    "min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 transition-all",
                                    !form.termsOverrideEnabled && "opacity-70 bg-slate-50"
                                )}
                            />
                        </div>
                    )}
                </section>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={loading}
                        className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none h-11 px-10 font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? "Creating..." : "Create Quotation"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onPreview}
                        className="rounded-2xl h-11 px-8 font-bold text-xs uppercase tracking-widest"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onPrint}
                        className="rounded-2xl h-11 px-8 font-bold text-xs uppercase tracking-widest"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/quotations")}
                        className="rounded-2xl h-11 px-8 font-bold text-xs uppercase tracking-widest"
                    >
                        Cancel
                    </Button>
                </div>
            </div>

            <AddItemDialog
                open={addItemOpen}
                onClose={() => setAddItemOpen(false)}
                onSuccess={(item) => {
                    setItems((prev) => [...prev, item]);
                    if (activeLineIdx !== null) {
                        updateLine(activeLineIdx, { itemId: item.id });
                    }
                }}
            />

            <AddCustomerDialog
                open={addCustomerOpen}
                onClose={() => setAddCustomerOpen(false)}
                onSuccess={(customer) => {
                    setParties((prev) => [...prev, customer]);
                    setForm((f) => ({ ...f, partyId: customer.id }));
                }}
            />

            <AddBillSundryDialog
                open={addSundryOpen}
                onClose={() => setAddSundryOpen(false)}
                onSuccess={(sundry) => {
                    setSundryOptions((prev) => [...prev, sundry]);
                    if (activeSundryIdx !== null) {
                        const row = billSundryComputed.rows[activeSundryIdx];
                        if (row) {
                            updateSundry(row.id, {
                                sundryId: sundry.id,
                                name: sundry.name,
                                type: sundry.type as any,
                                ratePct: sundry.rate?.toString() || "0"
                            });
                        }
                    }
                }}
            />
        </div>
    );
}
