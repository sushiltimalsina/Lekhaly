"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";

import { createPurchaseOrder } from "@/lib/api/purchase-orders";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listItems, type ItemRecord } from "@/lib/api/items";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddVendorDialog from "@/components/app/add-vendor-dialog";
import AddBillSundryDialog from "@/components/app/add-bill-sundry-dialog";
import { listBillSundries, type BillSundryRecord } from "@/lib/api/bill-sundries";

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
                    if (e.key === "Backspace" || e.key === "Delete") return;
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

export default function CreatePurchaseOrderPage() {
    const router = useRouter();
    const [mounted, setMounted] = React.useState(false);

    const orderDateRef = React.useRef<HTMLInputElement>(null);
    const deliveryDateRef = React.useRef<HTMLInputElement>(null);
    const orderNoRef = React.useRef<HTMLInputElement>(null);
    const vendorRefRef = React.useRef<HTMLInputElement>(null);
    const purchaseTypeRef = React.useRef<HTMLSelectElement>(null);
    const memoRef = React.useRef<HTMLInputElement>(null);
    const vendorSelectRef = React.useRef<HTMLButtonElement>(null);
    const addLineButtonRef = React.useRef<HTMLButtonElement>(null);
    const [addItemOpen, setAddItemOpen] = React.useState(false);
    const [activeLineIdx, setActiveLineIdx] = React.useState<number | null>(null);
    const [addVendorOpen, setAddVendorOpen] = React.useState(false);
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
            setTimeout(() => safeFocus(orderDateRef.current), 100);
        }
    }, [mounted]);

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        orderNoDisplay: "",
        partyId: "",
        orderDate: { bs: "", ad: "" },
        expectedDelivery: { bs: "", ad: "" },
        vendorRef: "",
        purchaseType: "vat_13" as any,
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
        const deliveryAd = isoAddDays(ad, 7);
        const deliveryBs = toBs(deliveryAd);

        setForm((f) => ({
            ...f,
            orderDate: { bs, ad },
            expectedDelivery: { bs: deliveryBs, ad: deliveryAd },
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
            listParties({ type: "supplier", take: 200 }),
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
            .reduce((sum: number, r: any) => sum + (r.type === "add" ? r.amount : -r.amount), 0);
    }, [billSundryComputed]);

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
            throw new Error("Vendor is required.");
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
            orderDate: form.orderDate.ad || undefined,
            orderDateBs: form.orderDate.bs || undefined,
            expectedDelivery: form.expectedDelivery.ad || undefined,
            expectedDeliveryBs: form.expectedDelivery.bs || undefined,
            vendorRef: form.vendorRef || undefined,
            purchaseType: form.purchaseType,
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
            const res: any = await createPurchaseOrder(buildPayload());
            const id = res?.id ?? res?.orderId ?? res?.data?.id;
            setSuccess(id ? `Purchase order created: ${id}` : "Purchase order created successfully.");
            setTimeout(() => router.push("/purchase-orders"), 1500);
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const onPreview = () => setSuccess("Preview: connect to your purchase order preview route/API.");
    const onPrint = () => setSuccess("Print: connect to your PDF + print flow.");
    const onPrintPreview = () => setSuccess("Print Preview: PDF version loading...");

    if (!mounted) return <div className="min-h-screen" />;

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between mb-6">
                    <PageHeader
                        title="Create Purchase Order"
                        description="Create a new purchase order for a vendor."
                    />
                    <Link href="/purchase-orders">
                        <Button variant="outline" className="rounded-2xl">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
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
                            ref={orderDateRef}
                            label="Order Date"
                            value={form.orderDate}
                            accentColor="bg-indigo-600"
                            onChange={(next) => setForm((f) => ({ ...f, orderDate: next }))}
                            onEnterNext={() => safeFocus(deliveryDateRef.current)}
                        />
                        <DualDateInput
                            ref={deliveryDateRef}
                            label="Expected Delivery"
                            value={form.expectedDelivery}
                            accentColor="bg-indigo-600"
                            onChange={(next) => setForm((f) => ({ ...f, expectedDelivery: next }))}
                            onEnterNext={() => safeFocus(orderNoRef.current)}
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12 lg:pr-[300px]">
                        <div className="lg:col-span-4 space-y-4">
                            <label className="space-y-1 text-sm block">
                                <span className="text-xs text-muted-foreground">Order No.</span>
                                <Input
                                    ref={orderNoRef}
                                    value={form.orderNoDisplay}
                                    onChange={(e) => setForm((f) => ({ ...f, orderNoDisplay: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            safeFocus(vendorRefRef.current);
                                        }
                                    }}
                                    placeholder="System generated"
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 font-medium"
                                />
                            </label>

                            <label className="space-y-1 text-sm block">
                                <span className="text-xs text-muted-foreground">Vendor Reference</span>
                                <Input
                                    ref={vendorRefRef}
                                    value={form.vendorRef}
                                    onChange={(e) => setForm((f) => ({ ...f, vendorRef: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            safeFocus(purchaseTypeRef.current);
                                        }
                                    }}
                                    placeholder="Vendor's internal reference (optional)"
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                />
                            </label>
                        </div>

                        <div className="lg:col-span-8 flex items-start lg:justify-center">
                            <div className="w-full max-w-[520px]">
                                <div className="text-xs text-muted-foreground">Purchase Type <span className="text-red-500">*</span></div>
                                <select
                                    ref={purchaseTypeRef}
                                    value={form.purchaseType}
                                    onChange={(e) => setForm((f) => ({ ...f, purchaseType: e.target.value as any }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            safeFocus(memoRef.current);
                                        }
                                    }}
                                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <option value="vat_13">VAT 13% Purchase</option>
                                    <option value="exempt">Exempt Purchase</option>
                                    <option value="import">Import / Export</option>
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
                                                safeFocus(vendorSelectRef.current);
                                            }
                                        }}
                                        placeholder="Brief description of purchase order"
                                        className="mt-2 h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 lg:hidden sm:grid-cols-2">
                            <DualDateInput
                                label="Order Date"
                                value={form.orderDate}
                                accentColor="bg-indigo-600"
                                onChange={(next) => setForm((f) => ({ ...f, orderDate: next }))}
                            />
                            <DualDateInput
                                label="Expected Delivery"
                                value={form.expectedDelivery}
                                accentColor="bg-indigo-600"
                                onChange={(next) => setForm((f) => ({ ...f, expectedDelivery: next }))}
                            />
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
                            buttonClassName="h-12 rounded-2xl bg-white dark:bg-slate-900 pr-[140px]"
                        />

                        {!form.partyId && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddVendorOpen(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 rounded-full px-4 text-xs"
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                New Vendor
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
                    <div className="text-[10px] text-muted-foreground italic pr-2">
                        Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[9px] not-italic font-sans">Shift + Enter</kbd> to jump sundry column
                    </div>
                </div>

                {/* Items Table */}
                <section className="mb-8 rounded-3xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Order Items</div>

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
                                                            onChange={(id, opt) => {
                                                                updateLine(idx, {
                                                                    itemId: id,
                                                                    rate: opt?.purchasePrice?.toString() || line.rate
                                                                });
                                                            }}
                                                            options={items}
                                                            getLabel={(it) => it.name}
                                                            onEnterNext={() => safeFocus(rowRefs.current.qty[idx])}
                                                            onKeyDownCustom={(e) => {
                                                                if (e.key === "Enter" && e.shiftKey) {
                                                                    e.preventDefault();
                                                                    safeFocus(sundryRefs.current.rate[0]);
                                                                }
                                                                if (e.key === "ArrowDown" && idx === lines.length - 1) {
                                                                    e.preventDefault();
                                                                    safeFocus(sundryRefs.current.rate[0]);
                                                                }
                                                                if (e.key === "ArrowUp" && idx > 0) {
                                                                    e.preventDefault();
                                                                    safeFocus(rowRefs.current.select[idx - 1]);
                                                                }
                                                                if (e.key === "ArrowDown" && idx < lines.length - 1) {
                                                                    e.preventDefault();
                                                                    safeFocus(rowRefs.current.select[idx + 1]);
                                                                }
                                                            }}
                                                            buttonClassName="h-10 border-none bg-transparent shadow-none px-0"
                                                        />
                                                        {idx === lines.length - 1 && (
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => setAddItemOpen(true)}
                                                                    className="h-8 w-8 rounded-full"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        ref={(el) => { rowRefs.current.qty[idx] = el; }}
                                                        type="number"
                                                        value={line.qty}
                                                        onChange={(e) => updateLine(idx, { qty: e.target.value })}
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
                                                                if (e.shiftKey) {
                                                                    e.preventDefault();
                                                                    safeFocus(sundryRefs.current.rate[0]);
                                                                    return;
                                                                }
                                                                e.preventDefault();
                                                                safeFocus(rowRefs.current.rate[idx]);
                                                            }
                                                        }}
                                                        placeholder="0"
                                                        className="h-10 w-full rounded-xl bg-white text-right dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        ref={(el) => { rowRefs.current.rate[idx] = el; }}
                                                        type="number"
                                                        value={line.rate}
                                                        onChange={(e) => updateLine(idx, { rate: e.target.value })}
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
                                                                if (e.shiftKey) {
                                                                    e.preventDefault();
                                                                    safeFocus(sundryRefs.current.rate[0]);
                                                                    return;
                                                                }
                                                                e.preventDefault();
                                                                if (idx === lines.length - 1) {
                                                                    addLine();
                                                                } else {
                                                                    safeFocus(rowRefs.current.select[idx + 1]);
                                                                }
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        className="h-10 w-full rounded-xl bg-white text-right dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 italic">
                                                    <MoneyText value={amt} />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(idx)}
                                                        disabled={lines.length === 1}
                                                        className={cn(
                                                            "h-10 w-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors",
                                                            lines.length === 1 && "opacity-0 pointer-events-none"
                                                        )}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

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
                                                    {!r.sundryId && r.id !== "discount" && r.id !== "vat" && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setActiveSundryIdx(i);
                                                                setAddSundryOpen(true);
                                                            }}
                                                            className="absolute z-10 right-7 top-1/2 -translate-y-1/2 h-7 rounded-lg px-1.5 text-[10px] font-medium bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            New
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
                                                        disabled={r.id === "vat"}
                                                        className="h-10 w-[110px] rounded-xl bg-white text-right dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    />
                                                    <span className="text-muted-foreground">%</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    {r.type === "less" ? "(" : null}
                                                    <div className="flex items-center">
                                                        <span className="mr-1 text-xs text-muted-foreground font-normal">Rs.</span>
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
                                                        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-red-600 hover:bg-red-50 dark:border-slate-800",
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
                                BS: <span className="font-medium text-foreground">{form.orderDate.bs || "—"}</span>{" "}
                                <span className="text-muted-foreground">({form.orderDate.ad || "—"})</span>
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
                            placeholder="Add overall remarks or terms for this order..."
                            className="min-h-[120px] w-full rounded-2xl border-2 border-slate-100 bg-slate-50/30 p-5 text-sm outline-none ring-indigo-500/10 focus:border-indigo-500 focus:bg-white focus:ring-4 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 transition-all font-medium leading-relaxed"
                        />
                    </div>
                </section>

                <section className="mt-8 mb-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <button type="button" onClick={() => setShowTerms((v) => !v)} className="flex w-full items-center gap-3">
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showTerms && "rotate-90")} />
                        <div className="text-sm font-semibold">Terms & Conditions</div>
                    </button>

                    <div className="mt-2 text-sm text-muted-foreground">Using company default</div>

                    <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="mt-3 text-sm font-medium text-slate-700 hover:underline dark:text-slate-200"
                    >
                        + Add terms & conditions
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
                                ref={termsRef}
                                value={form.termsText}
                                onChange={(e) => setForm((f) => ({ ...f, termsText: e.target.value }))}
                                disabled={!form.termsOverrideEnabled}
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
                                placeholder="Enter custom terms and conditions for this order..."
                                className={cn(
                                    "min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950",
                                    !form.termsOverrideEnabled && "opacity-70"
                                )}
                            />
                        </div>
                    ) : null}
                </section>

                <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8 pb-4">
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
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Grand Total</span>
                                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                    <MoneyText value={total} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                type="button"
                                onClick={onSave}
                                disabled={loading}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-500/25"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? "Generating..." : "Create Order"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={onPreview}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={onPrint}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={onPrintPreview}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Print Preview
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/purchase-orders")}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-8 font-bold text-xs uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition-all active:scale-95"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <AddItemDialog
                open={addItemOpen}
                onClose={() => setAddItemOpen(false)}
                onSuccess={(item) => {
                    setItems((prev) => [...prev, item]);
                    if (activeLineIdx !== null) {
                        updateLine(activeLineIdx, {
                            itemId: item.id,
                            rate: item.purchasePrice?.toString() || ""
                        });
                    }
                }}
            />

            <AddVendorDialog
                open={addVendorOpen}
                onClose={() => setAddVendorOpen(false)}
                onSuccess={(vendor) => {
                    setParties((prev) => [...prev, vendor]);
                    setForm((f) => ({ ...f, partyId: vendor.id }));
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
