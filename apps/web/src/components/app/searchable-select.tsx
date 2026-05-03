"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

export interface SearchableSelectProps<T> {
    label?: string;
    placeholder?: string;
    valueId?: string;
    value?: string;
    onChange: (id: string, opt?: T) => void;
    options: T[];
    getLabel?: (opt: T) => string;
    getDetail?: (opt: T) => string;
    leftIcon?: React.ReactNode;
    className?: string;
    buttonClassName?: string;
    emptyText?: string;
    buttonRef?: React.Ref<HTMLButtonElement>;
    onEnterNext?: () => void;
    onKeyDownCustom?: (e: React.KeyboardEvent<any>) => void;
    fallbackLabel?: string;
    disabled?: boolean;
}

export default function SearchableSelect<T extends any>(props: SearchableSelectProps<T>) {
    const {
        label,
        placeholder = "Select…",
        valueId: valueIdProp,
        value,
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
    const valueId = valueIdProp ?? value ?? "";

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

    const selected = React.useMemo(() => options.find((o: any) => (o.id ?? o.value) === valueId), [options, valueId]);
    const selectedLabel = selected
        ? (getLabel ? getLabel(selected) : ((selected as any).name ?? (selected as any).label ?? (selected as any).id ?? (selected as any).value))
        : (fallbackLabel || "");

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o: any) => {
            const val = getLabel ? getLabel(o) : (o.name ?? o.label ?? o.id ?? o.value ?? "");
            const labelText = String(val).toLowerCase();
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
                width: Math.max(rect.width, 250),
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
                                                onChange((item as any).id, item);
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
                                    className="w-full bg-transparent py-1.5 pl-8 pr-3 text-sm outline-none"
                                />
                            </div>
                        </div>
                        <div
                            className="max-h-[300px] overflow-y-auto p-1"
                            ref={listRef}
                        >
                            {filtered.length ? (
                                filtered.map((o, i) => {
                                    const itemId = (o as any).id ?? (o as any).value;
                                    const isSelected = itemId === valueId;
                                    const isActive = i === activeIndex;
                                    return (
                                        <div
                                            key={itemId}
                                            onClick={() => {
                                                onChange(itemId, o);
                                                setOpen(false);
                                                setQuery("");
                                            }}
                                            onMouseEnter={() => setActiveIndex(i)}
                                            className={cn(
                                                "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors gap-4",
                                                isActive ? "bg-slate-100 dark:bg-slate-800" : "",
                                                isSelected ? (isActive ? "bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-500 font-medium") : "text-slate-700 dark:text-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <span className="truncate">{getLabel ? getLabel(o) : ((o as any).name ?? (o as any).label)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {getDetail && <span className={cn("text-[11px] font-medium opacity-60", isSelected ? "text-emerald-600/70 dark:text-emerald-400/70" : "text-muted-foreground")}>{getDetail(o)}</span>}
                                                {isSelected && <Check className="h-4 w-4" />}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyText}</div>
                            )}
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
}
