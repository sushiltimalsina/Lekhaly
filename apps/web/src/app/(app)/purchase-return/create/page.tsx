"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import DualDateInput from "@/components/app/dual-date-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";

import { createVoucherDraft, type VoucherDraftInput } from "@/lib/api/vouchers";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
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
    Check,
    Eye,
    Printer,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toBs } from "@/lib/dates/bs";

type Line = { itemId: string; qty: string; rate: string; description?: string; expenseAccountId?: string };
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
    onKeyDownCustom?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
            {label ? <div className="text-xs text-muted-foreground ml-1">{label}</div> : null}

            <button
                type="button"
                onClick={() => !disabled && setOpen((v) => !v)}
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
                                                active ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                                selected && !active && "bg-slate-50 dark:bg-slate-800/30"
                                            )}
                                        >
                                            <span className="min-w-0 flex-1 truncate font-medium">{labelText}</span>
                                            {selected ? <Check className="h-4 w-4 text-indigo-600" /> : null}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</div>
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

export default function PurchaseReturnCreatePage() {
    const [mounted, setMounted] = React.useState(false);

    const purchaseDateRef = React.useRef<HTMLInputElement>(null);
    const vendorInvoiceDateRef = React.useRef<HTMLInputElement>(null);
    const invoiceNoRef = React.useRef<HTMLInputElement>(null);
    const vendorInvoiceNoRef = React.useRef<HTMLInputElement>(null);
    const payableAccountRef = React.useRef<HTMLSelectElement>(null);
    const purchaseTypeRef = React.useRef<HTMLSelectElement>(null);
    const memoRef = React.useRef<HTMLInputElement>(null);
    const referenceNoRef = React.useRef<HTMLInputElement>(null);
    const vendorSelectRef = React.useRef<HTMLButtonElement>(null);
    const addLineButtonRef = React.useRef<HTMLButtonElement>(null);
    const [lineErrors, setLineErrors] = React.useState<Record<number, { qty?: string; rate?: string }>>({});
    const [addItemOpen, setAddItemOpen] = React.useState(false);
    const [activeLineIdx, setActiveLineIdx] = React.useState<number | null>(null);
    const [addVendorOpen, setAddVendorOpen] = React.useState(false);
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

    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [items, setItems] = React.useState<ItemRecord[]>([]);
    const [sundryOptions, setSundryOptions] = React.useState<BillSundryRecord[]>([]);

    const safeFocus = (el: HTMLElement | null) => {
        if (!el) return;
        el.focus({ preventScroll: true });
    };

    React.useEffect(() => {
        if (mounted) {
            setTimeout(() => safeFocus(purchaseDateRef.current), 100);
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
        purchaseType: "vat_13" as any,
        memo: "",
        notes: "",
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

    const defaultPayable = React.useMemo(() => accounts[0]?.id ?? "", [accounts]);

    React.useEffect(() => setMounted(true), []);

    React.useEffect(() => {
        const now = new Date();
        const ad = now.toISOString().slice(0, 10);
        const bs = toBs(ad);

        setForm((f) => ({
            ...f,
            purchaseDate: { bs, ad },
            vendorInvoiceDate: { bs, ad },
        }));
    }, []);

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
            listItems({ take: 500 }),
            listBillSundries({ take: 100 })
        ])
            .then(([p, a, i, s]) => {
                if (!alive) return;
                setParties(normalizeList<PartyRecord>(p));
                setAccounts(normalizeList<AccountRecord>(a));
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
            };
        });

        if (!payloadLines.length) throw new Error("Add at least one item line.");

        // Validate and Add Sundry lines
        billSundryComputed.rows.forEach(r => {
            // Validate Sundry Name/Selection
            if (!r.sundryId) {
                throw new Error(`Bill Sundry '${r.name || "Unknown"}': Name is required.`);
            }

            if (Math.abs(r.amount) < 0.01 && !r.isManual) return; // Skip zero amount rows unless manual? Actually usually skip 0 effect. 
            // Wait, if validation is mandatory "if column is added", we should throw error even if amount is 0?
            // User requirement: "make ... sundry name mandatory if column is added"
            // So if checking sundryId above handles it.

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
            referenceNo: form.referenceNo || undefined,
            vendorInvoiceNo: form.vendorInvoiceNo || undefined,
            vendorInvoiceDate: form.vendorInvoiceDate.ad || undefined,
            lines: payloadLines as any,
        };
    };

    const onSave = async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            const res: any = await createVoucherDraft(buildPayload());
            const id = res?.id ?? res?.voucherId ?? res?.data?.id;
            setSuccess(id ? `Saved draft: ${id}` : "Saved draft.");
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const onSend = async () => {
        setError(null);
        setSuccess(null);
        setSending(true);
        try {
            const res: any = await createVoucherDraft(buildPayload());
            const id = res?.id ?? res?.voucherId ?? res?.data?.id;
            setSuccess(id ? `Purchase recorded and sent: ${id}` : "Purchase recorded.");
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setSending(false);
        }
    };

    const onPreview = () => setSuccess("Preview: connect to your purchase preview route.");
    const onPrint = () => setSuccess("Print: connect to your PDF flow.");

    if (!mounted) return <div className="min-h-screen" />;

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <PageHeader title="New Purchase Return" description="Fill in the details below to record a new purchase return (debit note)." />

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
                            label="Return Date"
                            value={form.purchaseDate}
                            onChange={(next) => setForm((f) => ({ ...f, purchaseDate: next }))}
                            onEnterNext={() => safeFocus(vendorInvoiceDateRef.current)}
                        />
                        <DualDateInput
                            ref={vendorInvoiceDateRef}
                            label="Original Invoice Date"
                            value={form.vendorInvoiceDate}
                            onChange={(next) => setForm((f) => ({ ...f, vendorInvoiceDate: next }))}
                            onEnterNext={() => safeFocus(invoiceNoRef.current)}
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12 lg:pr-[300px]">
                        <div className="lg:col-span-4 space-y-3">
                            <label className="space-y-1 text-sm">
                                <span className="text-xs text-muted-foreground">Return No.</span>
                                <Input
                                    ref={invoiceNoRef}
                                    value={form.referenceNo}
                                    onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            safeFocus(vendorInvoiceNoRef.current);
                                        }
                                    }}
                                    placeholder="Reference No."
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span className="text-xs text-muted-foreground">Original Invoice No. <span className="text-red-500">*</span></span>
                                <Input
                                    ref={vendorInvoiceNoRef}
                                    value={form.vendorInvoiceNo}
                                    onChange={(e) => setForm((f) => ({ ...f, vendorInvoiceNo: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            if (!form.vendorInvoiceNo) return;
                                            e.preventDefault();
                                            safeFocus(memoRef.current);
                                        }
                                    }}
                                    placeholder="Enter physical invoice number"
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                />
                            </label>


                        </div>

                        <div className="lg:col-span-8 flex items-start lg:justify-center">
                            <div className="w-full max-w-[520px]">
                                <label className="space-y-1 text-sm block">
                                    <span className="text-xs text-muted-foreground">Memo / Remarks</span>
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
                                        className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                    />
                                </label>

                                <div className="mt-4">
                                    <div className="text-xs text-muted-foreground">Purchase Return Type <span className="text-red-500">*</span></div>
                                    <select
                                        ref={purchaseTypeRef}
                                        value={form.purchaseType}
                                        onChange={(e) => setForm((f) => ({ ...f, purchaseType: e.target.value as any }))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                vendorSelectRef.current?.focus();
                                            }
                                        }}
                                        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <option value="vat_13">VAT 13% Return</option>
                                        <option value="exempt">Exempt Return</option>
                                        <option value="import">Import Return</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 lg:hidden sm:grid-cols-2">
                            <DualDateInput
                                label="Return Date"
                                value={form.purchaseDate}
                                onChange={(next) => setForm((f) => ({ ...f, purchaseDate: next }))}
                            />
                            <DualDateInput
                                label="Original Invoice Date"
                                value={form.vendorInvoiceDate}
                                onChange={(next) => setForm((f) => ({ ...f, vendorInvoiceDate: next }))}
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
                            onKeyDownCustom={(e: React.KeyboardEvent<HTMLInputElement>) => {
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

                {/* Add Column */}
                <div className="mb-3 flex flex-col items-end gap-1.5">
                    <Button
                        ref={addLineButtonRef}
                        type="button"
                        onClick={addLine}
                        className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
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
                                        <th className="w-[520px] min-w-[420px] px-4 py-3 text-left text-xs text-muted-foreground">Particulars</th>
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
                                                            onChange={(id, item) => {
                                                                updateLine(idx, {
                                                                    itemId: id,
                                                                    rate: item?.purchasePrice?.toString() || "",
                                                                    expenseAccountId: item?.expenseAccountId || undefined
                                                                });
                                                            }}
                                                            options={items}
                                                            getLabel={(it) => {
                                                                const code = it.hsCode ? ` (${it.hsCode})` : "";
                                                                return `${it.name ?? "Item"}${code}`;
                                                            }}
                                                            onEnterNext={() => safeFocus(rowRefs.current.qty[idx])}
                                                            onKeyDownCustom={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                                if (e.key === "Enter" && e.shiftKey) {
                                                                    e.preventDefault();
                                                                    safeFocus(sundryRefs.current.select[0]);
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
                                                            if (e.key === "Enter") {
                                                                if (e.shiftKey) {
                                                                    e.preventDefault();
                                                                    safeFocus(sundryRefs.current.select[0]);
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
                                                            if (e.key === "Enter") {
                                                                if (e.shiftKey) {
                                                                    e.preventDefault();
                                                                    safeFocus(sundryRefs.current.select[0]);
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
                    <Button type="button" variant="outline" onClick={addSundry} className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sundry Column
                    </Button>
                </div>

                {/* BILL SUNDRY */}
                <section className="mb-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
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
                                                            variant="outline"
                                                            onClick={() => {
                                                                setActiveSundryIdx(i);
                                                                setAddSundryOpen(true);
                                                            }}
                                                            className="absolute z-10 right-7 top-1/2 -translate-y-1/2 h-7 rounded-lg px-1.5 text-[10px] font-medium bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
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
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                if (sundryRefs.current.amount[i]) {
                                                                    safeFocus(sundryRefs.current.amount[i]);
                                                                } else if (sundryRefs.current.select[i + 1]) {
                                                                    safeFocus(sundryRefs.current.select[i + 1]);
                                                                }
                                                            }
                                                        }}
                                                        className="h-10 w-[110px] rounded-xl bg-white text-right dark:bg-slate-900"
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
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    if (sundryRefs.current.select[i + 1]) {
                                                                        safeFocus(sundryRefs.current.select[i + 1]);
                                                                    }
                                                                }
                                                            }}
                                                            placeholder="0.00"
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

                                    <tr className="border-t bg-slate-50/50 font-bold dark:bg-slate-900/50">
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
                                <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                    <MoneyText value={total} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Additional notes</div>
                            <div className="text-xs text-muted-foreground">
                                BS: <span className="font-medium text-foreground">{form.purchaseDate.bs || "—"}</span>{" "}
                                <span className="text-muted-foreground">({form.purchaseDate.ad || "—"})</span>
                            </div>
                        </div>

                        <Input
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            placeholder="Internal record notes..."
                            className="h-11 rounded-2xl bg-slate-50/60"
                        />

                        <div className="mt-8 flex flex-wrap items-center justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onPreview} className="rounded-full px-6">
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                            </Button>

                            <Button type="button" variant="outline" onClick={onPrint} className="rounded-full px-6">
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={onSave}
                                disabled={loading || sending}
                                className="rounded-full px-6"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? "Saving..." : "Save"}
                            </Button>

                            <Button
                                type="button"
                                onClick={onSend}
                                disabled={loading || sending}
                                className="rounded-full bg-indigo-600 px-8 text-white hover:bg-indigo-700"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {sending ? "Sending..." : "Record Purchase"}
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
        </div>
    );
}
