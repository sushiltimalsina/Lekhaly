"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import DualDateInput from "@/components/app/dual-date-input";
import { Input } from "@lekhaly/ui";
import { Button } from "@lekhaly/ui";
import { MoneyText } from "@/components/app/money";
import { cn } from "@/lib/utils";

import { createVoucherDraft, postVoucher, updateVoucherDraft, getVoucher, type VoucherDraftInput } from "@/lib/api/vouchers";
import { isOfflineQueuedResponse } from "@/lib/api/client";

import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listItems, type ItemRecord } from "@/lib/api/items";
import AddItemDialog from "@/components/app/add-item-dialog";
import AddVendorDialog from "@/components/app/add-vendor-dialog";
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
    Check,
    Eye,
    Printer,
    FileText,
    ChevronRight,
    ArrowLeft,
    RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
                                                active ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                                selected && !active && "bg-slate-50 dark:bg-slate-800/30"
                                            )}
                                        >
                                            <span className="min-w-0 flex-1 truncate font-medium">{labelText}</span>
                                            {selected ? <Check className="h-4 w-4 text-cyan-600" /> : null}
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

export default function PurchaseReturnCreatePage() {
    const [mounted, setMounted] = React.useState(false);

    const purchaseDateRef = React.useRef<HTMLInputElement>(null);
    const vendorInvoiceDateRef = React.useRef<HTMLInputElement>(null);
    const invoiceNoRef = React.useRef<HTMLInputElement>(null);
    const vendorInvoiceNoRef = React.useRef<HTMLInputElement>(null);
    const purchaseTypeRef = React.useRef<HTMLSelectElement>(null);
    const memoRef = React.useRef<HTMLInputElement>(null);
    const vendorSelectRef = React.useRef<HTMLButtonElement>(null);
    const addLineButtonRef = React.useRef<HTMLButtonElement>(null);
    const addSundryButtonRef = React.useRef<HTMLButtonElement>(null);
    const [lineErrors, setLineErrors] = React.useState<Record<number, { qty?: string; rate?: string }>>({});
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

    const notesRef = React.useRef<HTMLTextAreaElement>(null);

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
        partyName: "",
        voucherNumber: ""
    });

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

    const defaultPayable = React.useMemo(() => accounts[0]?.id ?? "", [accounts]);

    React.useEffect(() => setMounted(true), []);

    const ui = useUiState();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isEditMode, setIsEditMode] = React.useState(true);
    const [voucherStatus, setVoucherStatus] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (searchParams.get("id")) return;
        const now = new Date();
        const ad = now.toISOString().slice(0, 10);
        const bs = toBs(ad);

        setForm((f) => ({
            ...f,
            purchaseDate: { bs, ad },
            vendorInvoiceDate: { bs, ad },
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
            listBillSundries({ take: 100 })
        ])
            .then(([p, a, i, s]) => {
                if (!alive) return;
                setParties(normalizeList<PartyRecord>(p));
                setAccounts(normalizeList<AccountRecord>(a));
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

                const editId = searchParams.get("id");
                if (editId) {
                    setIsEditMode(false);
                    getVoucher(editId).then(v => {
                        setVoucherStatus(v.status || null);
                        const parseDate = (d: any) => {
                            if (!d) return "";
                            if (typeof d === "string") return d.split("T")[0];
                            if (d instanceof Date) return d.toISOString().split("T")[0];
                            return String(d).split("T")[0];
                        };

                        setForm(f => ({
                            ...f,
                            partyId: v.partyId || "",
                            payableAccountId: v.lines?.[0]?.accountId || "",
                            purchaseDate: { ad: parseDate(v.voucherDate), bs: v.voucherDateBs || "" },
                            vendorInvoiceDate: {
                                ad: parseDate(v.vendorInvoiceDate),
                                bs: v.vendorInvoiceDate ? toBs(parseDate(v.vendorInvoiceDate)) : ""
                            },
                            vendorInvoiceNo: v.vendorInvoiceNo || "",
                            memo: v.memo || "",
                            notes: v.additionalNote || "",
                            referenceNo: v.referenceNo || "",
                            partyName: v.party?.name || "",
                            voucherNumber: v.voucherNumber || ""
                        }));

                        const itemLines = (v.lines || []).filter((l: any) => l.itemId).map((l: any) => ({
                            itemId: l.itemId,
                            qty: String(Number(l.qty || 0)),
                            rate: l.qty && Number(l.qty) !== 0 ? String(Number(l.debit || l.credit) / Number(l.qty)) : "0",
                            description: l.description,
                            expenseAccountId: l.accountId
                        }));
                        if (itemLines.length > 0) setLines(itemLines);

                        const sundryLines = (v.lines || []).filter((l: any) => !l.itemId && l.accountId);
                        const mappedSundries: BillSundryRow[] = [];
                        sundryLines.forEach((l: any) => {
                            const matchingOpt = opts.find(o => o.accountId === l.accountId);
                            if (matchingOpt) {
                                mappedSundries.push({
                                    id: Math.random().toString(36).substr(2, 9),
                                    sundryId: matchingOpt.id,
                                    name: matchingOpt.name,
                                    type: (l.debit > 0) ? "add" : "less",
                                    ratePct: "",
                                    manualAmount: String(Number(l.debit || l.credit || 0)),
                                    isManual: true
                                });
                            }
                        });
                        if (mappedSundries.length > 0) setBillSundries(mappedSundries);

                    }).catch(err => console.error("Failed to load voucher", err));
                }
            })
            .catch((e: any) => {
                if (!alive) return;
                setError(e?.message ?? "Something went wrong.");
            });

        return () => { alive = false; };
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
        if (!form.vendorInvoiceNo) throw new Error("Vendor Invoice No. is required.");
        if (!form.partyId) throw new Error("Vendor is required.");
        if (!form.payableAccountId) throw new Error("Payable account is required.");

        lines.forEach((l, idx) => {
            if (!l.itemId) throw new Error(`Line ${idx + 1}: Item is required.`);
            const qty = Number(l.qty);
            const rate = Number(l.rate);
            if (isNaN(qty) || qty <= 0) throw new Error(`Line ${idx + 1}: Quantity must be greater than zero.`);
            if (isNaN(rate) || rate <= 0) throw new Error(`Line ${idx + 1}: Rate is required.`);
        });

        const payloadLines = lines.map((l) => {
            const qty = Number(l.qty);
            const rate = Number(l.rate);
            const item = items.find(it => it.id === l.itemId);
            return {
                itemId: l.itemId,
                accountId: l.expenseAccountId || item?.expenseAccountId || "",
                credit: qty * rate,
                qty,
                description: l.description || "Purchase Return",
            };
        });

        billSundryComputed.rows.forEach(r => {
            if (!r.sundryId) throw new Error(`Bill Sundry '${r.name || "Unknown"}': Name is required.`);
            if (Math.abs(r.amount) < 0.01) return;
            const sundryOpt = sundryOptions.find(o => o.id === r.sundryId);
            const accountId = sundryOpt?.accountId;
            if (!accountId) throw new Error(`Bill Sundry '${r.name}': No linked account found.`);

            payloadLines.push({
                accountId: accountId,
                credit: r.type === "add" ? r.amount : 0,
                debit: r.type === "less" ? r.amount : 0,
                description: r.name,
            } as any);
        });

        payloadLines.push({
            accountId: form.payableAccountId,
            debit: total,
            credit: 0,
            description: form.memo || "Purchase Return to vendor",
        } as any);

        return {
            voucherType: "purchase_return",
            voucherDate: form.purchaseDate.ad || undefined,
            voucherDateBs: form.purchaseDate.bs || undefined,
            partyId: form.partyId,
            memo: form.memo || "Purchase Return to vendor",
            additionalNote: form.notes || undefined,
            referenceNo: form.referenceNo || undefined,
            vendorInvoiceNo: form.vendorInvoiceNo || undefined,
            vendorInvoiceDate: form.vendorInvoiceDate.ad || undefined,
            lines: payloadLines as any,
        };
    };

    const onSave = async () => {
        setError(null); setSuccess(null); setLoading(true);
        try {
            const editId = searchParams.get("id");
            let res: any;
            if (editId) res = await updateVoucherDraft(editId, buildPayload());
            else res = await createVoucherDraft(buildPayload());
            if (isOfflineQueuedResponse(res)) { setSuccess(res.message); return; }
            const id = res?.id ?? res?.voucherId ?? res?.data?.id;
            setSuccess(id ? `Saved draft successfully.` : "Saved draft.");
            if (!editId && id) router.replace(`/purchase-return/create?id=${id}`);
        } catch (e: any) { setError(e?.message ?? "Something went wrong."); }
        finally { setLoading(false); }
    };

    const onPost = async () => {
        setError(null); setSuccess(null); setSending(true);
        try {
            const editId = searchParams.get("id");
            let res: any;
            if (editId) res = await updateVoucherDraft(editId, buildPayload());
            else res = await createVoucherDraft(buildPayload());
            if (isOfflineQueuedResponse(res)) { setError("Offline mode error."); return; }
            const id = res?.id ?? res?.voucherId ?? res?.data?.id ?? editId;
            if (!id) throw new Error("Failed to save draft.");
            await postVoucher(id);
            setSuccess(`Purchase return posted successfully.`);
            setTimeout(() => router.push("/purchase-return"), 1500);
        } catch (e: any) { setError(e?.message ?? "Something went wrong."); }
        finally { setSending(false); }
    };

    const onPreview = () => setSuccess("Preview loading...");
    const onPrint = () => setSuccess("Printing...");
    const onPrintPreview = () => setSuccess("Print Preview loading...");

    if (!mounted) return <div className="min-h-screen" />;

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-4">
                    <Button
                        onClick={() => router.push("/purchase-return")}
                        className="rounded-full h-10 px-4 bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Registry
                    </Button>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-xl shadow-cyan-500/20">
                            <RotateCcw className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold italic tracking-tight text-slate-900 dark:text-slate-100">
                                {searchParams.get("id") ? (isEditMode ? "Edit Purchase Return" : "View Purchase Return") : "Create New Purchase Return"}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                {searchParams.get("id")
                                    ? `${voucherStatus ? `Status: ${voucherStatus.charAt(0).toUpperCase() + voucherStatus.slice(1)}. ` : ""}${isEditMode ? "Modify the details below." : "Click Edit to modify this return."}`
                                    : "Fill in the details below to record a new purchase return (debit note)."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isEditMode && searchParams.get("id") ? (
                            <Button
                                onClick={() => setIsEditMode(true)}
                                className="rounded-full h-10 px-8 bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95"
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 0 002 2h11a2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </Button>
                        ) : undefined}
                    </div>
                </div>

                <div className="mb-4 grid gap-3">
                    {error && <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-700 whitespace-pre-line">{error}</div>}
                    {success && <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">{success}</div>}
                </div>

                <section className="relative mb-6">
                    <div className="absolute right-0 top-0 hidden w-[260px] flex-col gap-3 lg:flex">
                        <DualDateInput
                            ref={purchaseDateRef}
                            label="Return Date"
                            value={form.purchaseDate}
                            accentColor="bg-cyan-600"
                            onChange={(next) => setForm((f) => ({ ...f, purchaseDate: next }))}
                            onEnterNext={() => safeFocus(vendorInvoiceDateRef.current)}
                            disabled={!isEditMode}
                        />
                        <DualDateInput
                            ref={vendorInvoiceDateRef}
                            label="Original Invoice Date"
                            value={form.vendorInvoiceDate}
                            accentColor="bg-cyan-600"
                            onChange={(next) => setForm((f) => ({ ...f, vendorInvoiceDate: next }))}
                            onEnterNext={() => safeFocus(vendorInvoiceNoRef.current)}
                            disabled={!isEditMode}
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12 lg:pr-[300px]">
                        <div className="lg:col-span-4 space-y-3">
                            <label className="space-y-1 text-sm">
                                <span className="text-xs text-muted-foreground">Return No.</span>
                                <Input
                                    ref={invoiceNoRef}
                                    value={form.referenceNo || form.voucherNumber}
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                    disabled={true}
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span className="text-xs text-muted-foreground">Original Invoice No. <span className="text-red-500">*</span></span>
                                <Input
                                    ref={vendorInvoiceNoRef}
                                    value={form.vendorInvoiceNo}
                                    onChange={(e) => setForm((f) => ({ ...f, vendorInvoiceNo: e.target.value }))}
                                    placeholder="Enter physical invoice number"
                                    className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                    disabled={!isEditMode}
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
                                        placeholder="Reason for return"
                                        className="h-11 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60"
                                        disabled={!isEditMode}
                                    />
                                </label>

                                <div className="mt-4">
                                    <div className="text-xs text-muted-foreground">Purchase Return Type <span className="text-red-500">*</span></div>
                                    <select
                                        ref={purchaseTypeRef}
                                        value={form.purchaseType}
                                        onChange={(e) => setForm((f) => ({ ...f, purchaseType: e.target.value as any }))}
                                        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                        disabled={!isEditMode}
                                    >
                                        <option value="vat_13">VAT 13% Return</option>
                                        <option value="exempt">Exempt Return</option>
                                        <option value="import">Import Return</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-6">
                    <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Vendor</div>
                    <div className="relative max-w-[980px]">
                        <SearchableSelect<PartyRecord>
                            buttonRef={vendorSelectRef}
                            placeholder="Search vendor…"
                            valueId={form.partyId}
                            fallbackLabel={form.partyName}
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full px-4 text-xs bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95"
                            >
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                New Vendor
                            </Button>
                        )}
                    </div>
                </section>

                {isEditMode && (
                    <div className="mb-3 flex flex-col items-end gap-1.5">
                        <Button
                            ref={addLineButtonRef}
                            type="button"
                            onClick={addLine}
                            className="rounded-full h-10 px-4 bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Column
                        </Button>
                    </div>
                )}

                <section className="mb-8 rounded-3xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Items Details</div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/30">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-100/70 dark:bg-slate-900/40">
                                    <tr>
                                        <th className="w-[60px] px-4 py-3 text-left text-xs text-muted-foreground">S.No.</th>
                                        <th className="w-[520px] min-w-[420px] px-4 py-3 text-left text-xs text-muted-foreground">Particulars</th>
                                        <th className="w-[140px] px-4 py-3 text-left text-xs text-muted-foreground">Qty <span className="text-red-500">*</span></th>
                                        <th className="w-[180px] px-4 py-3 text-left text-xs text-muted-foreground">Rate <span className="text-red-500">*</span></th>
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
                                                            getLabel={(it) => it.name}
                                                            onEnterNext={() => safeFocus(rowRefs.current.qty[idx])}
                                                            leftIcon={<Search className="h-4 w-4" />}
                                                            buttonClassName="h-11 rounded-2xl bg-white dark:bg-slate-900 pr-[100px]"
                                                            disabled={!isEditMode}
                                                        />
                                                        {!line.itemId && isEditMode && (
                                                            <Button
                                                                type="button"
                                                                onClick={() => { setActiveLineIdx(idx); setAddItemOpen(true); }}
                                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 rounded-xl px-3 text-[10px] font-medium bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95"
                                                            >
                                                                <Plus className="mr-1 h-3 w-3" /> Add item
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <Input
                                                        ref={(el) => { rowRefs.current.qty[idx] = el; }}
                                                        type="number"
                                                        value={line.qty}
                                                        onChange={(e) => {
                                                            updateLine(idx, { qty: e.target.value });
                                                            setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], qty: undefined } }));
                                                        }}
                                                        disabled={!isEditMode}
                                                        className={cn("h-11 rounded-2xl bg-white text-center dark:bg-slate-900 transition-colors", lineErrors[idx]?.qty && "border-red-500")}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <Input
                                                        ref={(el) => { rowRefs.current.rate[idx] = el; }}
                                                        type="number"
                                                        value={line.rate}
                                                        onChange={(e) => {
                                                            updateLine(idx, { rate: e.target.value });
                                                            setLineErrors(prev => ({ ...prev, [idx]: { ...prev[idx], rate: undefined } }));
                                                        }}
                                                        disabled={!isEditMode}
                                                        className={cn("h-11 rounded-2xl bg-white text-center dark:bg-slate-900 transition-colors", lineErrors[idx]?.rate && "border-red-500")}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold"><MoneyText value={amt} /></td>
                                                <td className="px-4 py-3 text-right">
                                                    {isEditMode && lines.length > 1 && (
                                                        <button type="button" onClick={() => removeLine(idx)} className="h-10 w-10 text-red-600 hover:bg-red-50 rounded-xl border">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="border-t bg-slate-100/60 font-semibold dark:bg-slate-900/40">
                                        <td /><td className="px-4 py-3 text-right">Total</td>
                                        <td className="px-4 py-3 text-center">{totalQty}</td>
                                        <td /><td className="px-4 py-3 text-right"><MoneyText value={itemsSubtotal} /></td><td />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {isEditMode && (
                    <div className="mb-4 flex flex-col items-end gap-2 text-right">
                        <Button
                            ref={addSundryButtonRef}
                            type="button"
                            onClick={addSundry}
                            className="rounded-full h-10 px-4 bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Sundry Column
                        </Button>
                    </div>
                )}

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
                                                            if (opt) updateSundry(r.id, { sundryId: opt.id, name: opt.name, type: opt.type as any, ratePct: opt.rate?.toString() || "0" });
                                                        }}
                                                        options={sundryOptions}
                                                        getLabel={(s) => s.name}
                                                        buttonClassName="h-10 rounded-xl pr-[110px]"
                                                        disabled={!isEditMode || r.id === "vat" || r.id === "discount"}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Input
                                                    type="number"
                                                    value={r.ratePct}
                                                    onChange={(e) => updateSundry(r.id, { ratePct: e.target.value, isManual: false })}
                                                    disabled={!isEditMode || r.id === "vat"}
                                                    className="h-10 w-[80px] rounded-xl bg-white text-right dark:bg-slate-900"
                                                /> %
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold">
                                                <Input
                                                    value={r.isManual ? (r.manualAmount || "") : r.amount.toFixed(2)}
                                                    onChange={(e) => updateSundry(r.id, { manualAmount: e.target.value, isManual: true })}
                                                    disabled={!isEditMode || r.id === "vat"}
                                                    className="h-8 w-24 rounded-lg text-right"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {isEditMode && r.id !== "vat" && r.id !== "discount" && (
                                                    <button type="button" onClick={() => removeSundry(r.id)} className="h-9 w-9 text-red-600 hover:bg-red-50 rounded-xl border">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t bg-slate-50/50 font-bold dark:bg-slate-900/50">
                                        <td colSpan={3} className="px-3 py-3 text-right text-slate-500">Net Bill Sundry</td>
                                        <td className="px-3 py-3 text-right">
                                            <span className={cn(billSundryComputed.net >= 0 ? "text-emerald-600" : "text-red-600")}>
                                                {billSundryComputed.net < 0 ? "-" : "+"} <MoneyText value={Math.abs(billSundryComputed.net)} />
                                            </span>
                                        </td><td />
                                    </tr>
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
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Taxable Total</span><MoneyText value={taxableAmount} /></div>
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Non-Taxable Total</span><MoneyText value={nonTaxableAmount} /></div>
                                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1 op-40" />
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><MoneyText value={itemsSubtotal} /></div>
                                <div className="flex items-center justify-between"><span className="text-muted-foreground">VAT</span><MoneyText value={billSundryComputed.rows.find(r => r.id === "vat")?.amount ?? 0} /></div>
                            </div>
                            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-950">
                                <div className="text-sm font-semibold">Total</div>
                                <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400"><MoneyText value={total} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-6 rounded-3xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-2 flex items-center justify-between"><div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Additional notes</div></div>
                        <textarea
                            ref={notesRef as any}
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            className="min-h-[120px] w-full rounded-2xl border-2 border-slate-100 bg-slate-50/30 p-5 text-sm outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-950 transition-all"
                            disabled={!isEditMode}
                        />
                        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                            {(!voucherStatus || voucherStatus === "draft") && isEditMode && (
                                <>
                                    <Button onClick={onSave} className="rounded-full h-10 px-6 bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95">
                                        <Save className="mr-2 h-4 w-4" /> Save Draft
                                    </Button>
                                    <Button onClick={onPost} className="flex-1 md:flex-none rounded-2xl h-12 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all bg-cyan-600 text-white hover:!bg-cyan-700 hover:scale-105 active:scale-95 shadow-cyan-500/25">
                                        <Send className="mr-2 h-4 w-4" /> Post Return
                                    </Button>
                                </>
                            )}
                            <Button onClick={onPreview} className="rounded-full h-10 px-6 bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95">
                                <Eye className="mr-2 h-4 w-4" /> Preview
                            </Button>
                            <Button onClick={onPrint} className="rounded-full h-10 px-6 bg-white text-slate-900 border border-slate-200 hover:!bg-cyan-600 hover:!text-white hover:!border-cyan-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 transition-colors shadow-sm active:scale-95">
                                <Printer className="mr-2 h-4 w-4" /> Print
                            </Button>
                        </div>
                    </div>
                </section>
            </div>

            <AddItemDialog open={addItemOpen} onClose={() => setAddItemOpen(false)} onSuccess={(newItem) => { setItems(prev => [...prev, newItem]); if (activeLineIdx !== null) updateLine(activeLineIdx, { itemId: newItem.id, rate: newItem.purchasePrice?.toString() || "" }); }} />
            <AddVendorDialog open={addVendorOpen} onClose={() => setAddVendorOpen(false)} onSuccess={(newVendor) => { setParties(prev => [...prev, newVendor]); setForm(f => ({ ...f, partyId: newVendor.id })); }} />
            <AddBillSundryDialog open={addSundryOpen} onClose={() => setAddSundryOpen(false)} onSuccess={(newSundry) => { setSundryOptions(prev => [...prev, newSundry]); if (activeSundryIdx !== null) { const r = billSundries[activeSundryIdx]; if (r) updateSundry(r.id, { sundryId: newSundry.id, name: newSundry.name, type: newSundry.type as any, ratePct: newSundry.rate?.toString() || "0" }); } }} />
        </div>
    );
}
