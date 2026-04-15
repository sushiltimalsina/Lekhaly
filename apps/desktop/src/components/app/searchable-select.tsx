// apps/desktop/src/components/app/searchable-select.tsx
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
}

export default function SearchableSelect<T extends { id: string; name?: string }>(props: SearchableSelectProps<T>) {
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
            const name = (getLabel ? getLabel(o) : o.name ?? o.id).toLowerCase();
            return name.includes(q);
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
                width: Math.max(rect.width, 280),
                zIndex: 1000,
                opacity: 1,
                pointerEvents: "auto",
            });
        };
        update();
        const timer = setTimeout(() => {
            inputRef.current?.focus({ preventScroll: true });
        }, 100);

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
            {label ? <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div> : null}

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
                    "flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition-all hover:border-primary/30",
                    "dark:border-slate-800 dark:bg-slate-900",
                    disabled && "opacity-60 cursor-not-allowed bg-slate-50",
                    buttonClassName
                )}
            >
                {leftIcon ? <span className="text-slate-400">{leftIcon}</span> : null}
                <span className={cn("min-w-0 flex-1 truncate font-bold text-slate-700 dark:text-slate-200", !selectedLabel && "text-slate-400")}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {open
                ? createPortal(
                    <div
                        ref={menuRef}
                        style={menuStyle}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-950"
                    >
                        <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-900">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                            e.preventDefault();
                                            setOpen(false);
                                            buttonRef.current?.focus();
                                            return;
                                        }
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            setActiveIndex((p) => (p + 1) % Math.max(1, filtered.length));
                                        }
                                        if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            setActiveIndex((p) => (p - 1 + filtered.length) % Math.max(1, filtered.length));
                                        }
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const item = filtered[activeIndex];
                                            if (item) {
                                                onChange(item.id, item);
                                                setOpen(false);
                                                setQuery("");
                                                setTimeout(() => {
                                                    if (props.onEnterNext) props.onEnterNext();
                                                    else buttonRef.current?.focus();
                                                }, 10);
                                            }
                                        }
                                    }}
                                    placeholder="Search..."
                                    className="w-full bg-transparent py-1.5 pl-8 pr-3 text-sm outline-none font-bold text-slate-700"
                                />
                            </div>
                        </div>
                        <div
                            className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar"
                            ref={listRef}
                        >
                            {filtered.length ? (
                                filtered.map((o, i) => {
                                    const isSelected = o.id === valueId;
                                    const isActive = i === activeIndex;
                                    const labelText = getLabel ? getLabel(o) : o.name;
                                    const detailText = getDetail ? getDetail(o) : undefined;
                                    
                                    return (
                                        <div
                                            key={o.id}
                                            onClick={() => {
                                                onChange(o.id, o);
                                                setOpen(false);
                                                setQuery("");
                                            }}
                                            onMouseEnter={() => setActiveIndex(i)}
                                            className={cn(
                                                "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all",
                                                isActive ? "bg-primary/5 text-primary" : "text-slate-600 dark:text-slate-400",
                                                isSelected && "bg-primary/10 text-primary font-black"
                                            )}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="truncate">{labelText}</span>
                                                {detailText && <span className="text-[10px] opacity-60 uppercase font-bold">{detailText}</span>}
                                            </div>
                                            {isSelected && <Check className="h-4 w-4 stroke-[3px]" />}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">{emptyText}</div>
                            )}
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
}
