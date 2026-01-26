"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/app/money";
import DualDateInput from "@/components/app/dual-date-input";
import { createVoucherDraft, type VoucherDraftInput } from "@/lib/api/vouchers";
import { listParties, type PartyRecord } from "@/lib/api/parties";
import { listAccounts, type AccountRecord } from "@/lib/api/accounts";
import { listItems, type ItemRecord } from "@/lib/api/items";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Save, Send, Search, ChevronDown, Check } from "lucide-react";
import { toBs } from "@/lib/dates/bs";

type Line = {
    itemId: string;
    qty: string;
    rate: string;
    description?: string;
    expenseAccountId?: string;
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
        if (typeof props.buttonRef === "function") {
            props.buttonRef(node);
        } else {
            (props.buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }
    };
    const scrollRef = React.useRef<{ x: number; y: number } | null>(null);
    const outsideRefs = React.useMemo(() => [menuRef], []);
    const wrapRef = useOutsideClick<HTMLDivElement>(() => setOpen(false), outsideRefs);
    const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});
    const focusNext = (from?: HTMLElement | null) => {
        if (!from) return;
        const doc = from.ownerDocument || document;
        const focusables = Array.from(
            doc.querySelectorAll<HTMLElement>(
                'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
        const idx = focusables.indexOf(from);
        if (idx >= 0 && idx + 1 < focusables.length) {
            focusables[idx + 1].focus();
        }
    };
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
            if (scrollRef.current) {
                window.scrollTo(scrollRef.current.x, scrollRef.current.y);
            }
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
                    if (e.key === "Enter" && !open) {
                        e.preventDefault();
                        focusNext(buttonRef.current);
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
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const first = filtered[0];
                                            if (first) {
                                                onChange(first.id);
                                            }
                                            setOpen(false);
                                            setQuery("");
                                            focusNext(buttonRef.current);
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
                                                focusNext(buttonRef.current);
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

export default function PurchaseCreatePage() {
    const [mounted, setMounted] = React.useState(false);
    const [parties, setParties] = React.useState<PartyRecord[]>([]);
    const [accounts, setAccounts] = React.useState<AccountRecord[]>([]);
    const [items, setItems] = React.useState<ItemRecord[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [form, setForm] = React.useState({
        partyId: "",
        payableAccountId: "",
        date: { bs: "", ad: "" },
        referenceNo: "",
        memo: "",
        notes: "",
    });

    const [lines, setLines] = React.useState<Line[]>([{ itemId: "", qty: "1", rate: "" }]);
    const firstItemSelectRef = React.useRef<HTMLButtonElement | null>(null);

    const focusNextElement = React.useCallback((from?: HTMLElement | null) => {
        const doc = (from?.ownerDocument || document) as Document;
        const focusables = Array.from(
            doc.querySelectorAll<HTMLElement>(
                'input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(
            (el) =>
                !el.hasAttribute("disabled") &&
                !el.getAttribute("aria-hidden") &&
                el.getAttribute("data-skip-enter") !== "true"
        );
        const current = from ?? (doc.activeElement as HTMLElement | null);
        if (!current) return;
        const idx = focusables.indexOf(current);
        if (idx >= 0 && idx + 1 < focusables.length) {
            focusables[idx + 1].focus();
        }
    }, []);

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
            listParties({ type: "supplier", take: 100 }),
            listAccounts({ type: "liability", take: 100 }),
            listItems({ take: 100 }),
        ])
            .then(([p, a, i]) => {
                if (!alive) return;
                setParties(normalizeList<PartyRecord>(p));
                setAccounts(normalizeList<AccountRecord>(a));
                setItems(normalizeList<ItemRecord>(i));
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
        setLines((prev) =>
            prev.map((l, i) => {
                if (i !== idx) return l;
                const next = { ...l, ...patch };
                if (patch.itemId) {
                    const item = items.find((it) => it.id === patch.itemId);
                    if (item) {
                        next.rate = String(item.purchasePrice || "");
                        next.expenseAccountId = item.expenseAccountId || undefined;
                    }
                }
                return next;
            })
        );
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

    const buildPayload = (): VoucherDraftInput => {
        if (!form.partyId || !form.payableAccountId) {
            throw new Error("Vendor and payable account are required.");
        }

        const validLines = lines.filter((l) => l.itemId && Number(l.qty) > 0);
        if (!validLines.length) throw new Error("Add at least one item line.");

        const voucherLines = validLines.map((l) => ({
            accountId: l.expenseAccountId || "",
            itemId: l.itemId,
            description: l.description || "Purchase",
            debit: Number(l.qty) * Number(l.rate),
            qty: Number(l.qty),
        }));

        // Add credit line for payable
        voucherLines.push({
            accountId: form.payableAccountId,
            debit: 0,
            credit: total,
        } as any);

        return {
            voucherType: "purchase",
            voucherDate: form.date.ad || undefined,
            voucherDateBs: form.date.bs || undefined,
            partyId: form.partyId,
            memo: form.memo || "Purchase from vendor",
            lines: voucherLines as any,
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
            setError(formatError(e));
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return <div className="min-h-screen" />;

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-xl shadow-slate-200/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/20">
                <PageHeader
                    title="New Purchase Invoice"
                    description="Purchase details fill the page. Summary and actions are at the bottom."
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
                    {/* Purchase details */}
                    <div className="lg:col-span-12 space-y-6">
                        {/* Vendor + Purchase Details */}
                        <section className="rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-slate-900/80">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-sm font-semibold">Purchase Details</div>
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="rounded-full border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    New Vendor
                                </Button>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                                <SearchableSelect<PartyRecord>
                                    label="Vendor"
                                    placeholder="Search vendor…"
                                    valueId={form.partyId}
                                    onChange={(id) => setForm((f) => ({ ...f, partyId: id }))}
                                    options={parties}
                                    getLabel={(p) => p.name}
                                    leftIcon={<Search className="h-4 w-4" />}
                                    className="lg:col-span-2"
                                />

                                <div className="lg:col-span-1">
                                    <DualDateInput
                                        label="Purchase Date"
                                        value={form.date}
                                        onChange={(next) => setForm((f) => ({ ...f, date: next }))}
                                        onEnterNext={() => focusNextElement()}
                                    />
                                </div>

                                <label className="space-y-1 text-sm lg:col-span-1">
                                    <span className="text-xs text-muted-foreground">Reference No.</span>
                                    <Input
                                        value={form.referenceNo}
                                        onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                                        placeholder="Enter reference (optional)"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                focusNextElement(e.currentTarget);
                                            }
                                        }}
                                    />
                                </label>

                                <label className="space-y-1 text-sm lg:col-span-2">
                                    <span className="text-xs text-muted-foreground">Payable Account</span>
                                    <select
                                        value={form.payableAccountId}
                                        onChange={(e) => setForm((f) => ({ ...f, payableAccountId: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                firstItemSelectRef.current?.focus();
                                            }
                                        }}
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
                                <div className="text-sm font-semibold">Items Details</div>
                                <Button type="button" variant="outline" onClick={addLine} className="rounded-full px-4 bg-white/70">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add item
                                </Button>
                            </div>

                            <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/40">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-100/80 dark:bg-slate-800/60">
                                        <tr>
                                            <th className="w-[540px] min-w-[460px] px-3 py-2 text-center text-xm text-muted-foreground">
                                                Particulars
                                            </th>
                                            <th className="w-[120px] px-3 py-2 text-left text-xm text-muted-foreground">Qty</th>
                                            <th className="w-[140px] px-3 py-2 text-left text-xm text-muted-foreground">Rate</th>
                                            <th className="w-[160px] px-3 py-2 text-right text-xm text-muted-foreground">Amount</th>
                                            <th className="w-[60px] px-3 py-2 text-right text-xm text-muted-foreground" />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {lines.map((line, idx) => {
                                            const qty = Number(line.qty || 0);
                                            const rate = Number(line.rate || 0);
                                            const amt = qty * rate;

                                            return (
                                                <tr key={idx} className="border-t border-slate-200/70 dark:border-slate-700/70">
                                                    <td className="w-[540px] min-w-[460px] px-3 py-2">
                                                        <SearchableSelect<ItemRecord>
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
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            focusNextElement(e.currentTarget);
                                                        }
                                                    }}
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
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            focusNextElement(e.currentTarget);
                                                        }
                                                    }}
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
                                placeholder="Goods and services purchased"
                            />
                        </section>

                        {/* ✅ BOTTOM SUMMARY */}
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
                                            onClick={() => window.history.back()}
                                            className="rounded-full px-6 bg-white/70"
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={onSave}
                                            disabled={loading}
                                            className="rounded-full px-6 bg-slate-800 text-white hover:bg-slate-900"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            {loading ? "Saving..." : "Save Draft"}
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








