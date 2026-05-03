"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@lekhaly/ui";
import { adToBs, bsToAd } from "@/lib/dates/convert";
import { formatDisplayDate } from "@/lib/dates/display";
import { getSettings, subscribeSettings, type CalendarPreference } from "@/lib/store/settings";
import { createPortal } from "react-dom";
import { Calendar as CalendarPicker } from "./calendar";

type DualDateValue = { ad: string; bs: string };

type DualDateInputProps = {
  label?: string;
  value: DualDateValue;
  onChange: (next: DualDateValue) => void;
  preferred?: CalendarPreference;
  required?: boolean;
  disabled?: boolean;
  onEnterNext?: () => void;
  className?: string;
  accentColor?: string; // Optional accent color class e.g. "bg-rose-600"
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

const DualDateInput = React.forwardRef<HTMLInputElement, DualDateInputProps>(
  (props, ref) => {
    const {
      label,
      value,
      onChange,
      preferred,
      required,
      disabled,
      onEnterNext,
      className,
      accentColor = "bg-primary",
    } = props;

    const [mounted, setMounted] = React.useState(false);
    const [preference, setPreference] = React.useState<CalendarPreference>(
      preferred || getSettings().calendarPreference || "BS"
    );

    React.useEffect(() => {
      setMounted(true);
      const unsubscribe = subscribeSettings((s) => {
        if (s.calendarPreference) setPreference(s.calendarPreference);
      });
      return () => { unsubscribe(); };
    }, []);

    const [open, setOpen] = React.useState(false);
    const [localMain, setLocalMain] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);

    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = useOutsideClick<HTMLDivElement>(() => setOpen(false), [buttonRef]);

    const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({
      position: "fixed",
      top: -9999,
      left: -9999,
      opacity: 0,
    });

    React.useEffect(() => {
      if (open) {
        const rect = buttonRef.current?.parentElement?.getBoundingClientRect();
        if (rect) {
          const PANEL_WIDTH = 320;
          const PANEL_HEIGHT = 360;
          const GAP = 8;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const placeBelowTop = rect.bottom + GAP;
          const placeAboveTop = rect.top - PANEL_HEIGHT - GAP;
          const top =
            placeBelowTop + PANEL_HEIGHT <= vh - GAP
              ? placeBelowTop
              : Math.max(GAP, placeAboveTop);
          const left = Math.min(
            Math.max(GAP, rect.left),
            Math.max(GAP, vw - PANEL_WIDTH - GAP)
          );

          setMenuStyle({
            position: "fixed",
            top,
            left,
            zIndex: 1500,
            opacity: 1,
          });
        }
      }
    }, [open]);

    const todayAd = new Date().toISOString().slice(0, 10);
    const todayBs = adToBs(todayAd);

    const display = React.useMemo(() => {
      const formatted = formatDisplayDate(value, preference);
      return {
        main: formatted.primary === "--" ? "" : formatted.primary,
        secondary: formatted.secondary,
      };
    }, [preference, value.ad, value.bs]);

    const handleAdCommit = (nextAd: string) => {
      if (!nextAd) {
        setError(null);
        onChange({ ad: "", bs: "" });
        return;
      }
      try {
        const bs = adToBs(nextAd);
        setError(null);
        onChange({ ad: nextAd, bs });
      } catch {
        setError("Invalid AD date");
      }
    };

    const handleBsCommit = (nextBs: string) => {
      if (!nextBs) {
        setError(null);
        onChange({ ad: "", bs: "" });
        return;
      }
      try {
        const ad = bsToAd(nextBs);
        setError(null);
        onChange({ ad, bs: nextBs });
      } catch {
        setError("Invalid BS date");
      }
    };

    const secondaryLabel = preference === "AD" ? "BS" : "AD";

    return (
      <div className={cn("space-y-1 relative", className)}>
        {label ? (
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1">
            {label}
            {required ? " *" : ""}
          </label>
        ) : null}

        <div className="group/input">
          <div className="relative">
            <Input
              ref={ref}
              type="text"
              value={localMain || display.main || ""}
              onChange={(e) => setLocalMain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  let val = localMain || (preference === "AD" ? value.ad : value.bs);
                  if (!val) {
                    val = preference === "AD" ? todayAd : todayBs;
                  }
                  if (preference === "AD") handleAdCommit(val);
                  else handleBsCommit(val);
                  setLocalMain("");
                  setOpen(false);
                  onEnterNext?.();
                }
              }}
              onBlur={() => {
                if (localMain) {
                  if (preference === "AD") handleAdCommit(localMain);
                  else handleBsCommit(localMain);
                  setLocalMain("");
                }
              }}
              placeholder="YYYY-MM-DD"
              disabled={disabled}
              className="h-10 rounded-xl bg-white border-slate-200 pr-10 hover:border-slate-300 focus:ring-2 focus:ring-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:hover:border-slate-700 dark:text-slate-200 transition-all font-mono font-medium"
              onFocus={() => setOpen(true)}
            />
            <button
              type="button"
              ref={buttonRef}
              onClick={() => setOpen((v) => !v)}
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-all"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-1 flex items-center justify-between px-1 min-h-[16px]">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              {secondaryLabel}: <span className="text-slate-600 dark:text-slate-300 font-black">{display.secondary || "N/A"}</span>
            </div>
            {error && <div className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded dark:bg-red-500/10 uppercase tracking-tighter">{error}</div>}
          </div>
        </div>

        {open && mounted && createPortal(
            <div
              ref={panelRef}
              style={menuStyle}
              className="z-[1500] w-[320px] dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-150"
            >
            <CalendarPicker
              value={value.ad}
              onChange={(ad) => {
                const bs = adToBs(ad);
                onChange({ ad, bs });
                setOpen(false);
                onEnterNext?.();
              }}
              accentColor={accentColor}
            />
          </div>,
          document.body
        )}
      </div>
    );
  }
);

DualDateInput.displayName = "DualDateInput";

export { DualDateInput };
export default DualDateInput;

