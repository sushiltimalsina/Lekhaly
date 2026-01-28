"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { dateConfigMap } from "nepali-date-converter";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { adToBs, bsToAd } from "@/lib/dates/convert";
import { formatDisplayDate } from "@/lib/dates/display";
import { getSettings, subscribeSettings, type CalendarPreference } from "@/lib/store/settings";
import { createPortal } from "react-dom";

type DualDateValue = { ad: string; bs: string };

type DualDateInputProps = {
  label: string;
  value: DualDateValue;
  onChange: (next: DualDateValue) => void;
  preferred?: CalendarPreference;
  required?: boolean;
  disabled?: boolean;
  onEnterNext?: () => void;
  className?: string;
  accentColor?: string; // Optional accent color class e.g. "bg-rose-600"
};

const BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Asar",
  "Shrawan",
  "Bhadra",
  "Aswin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

type BsMonthKey = (typeof BS_MONTHS)[number];

const WEEK_DAYS_NP = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];
const BS_MONTHS_NP = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भदौ",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पौष",
  "माघ",
  "फाल्गुन",
  "चैत्र",
] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toNepaliDigits(value: number | string) {
  const map = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(value)
    .split("")
    .map((char) => (char >= "0" && char <= "9" ? map[Number(char)] : char))
    .join("");
}

function parseAd(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseBs(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function getMaxBsDay(year: number, month: number) {
  if (month < 1 || month > 12) return 0;
  const yearConfig = (dateConfigMap as Record<string, Record<BsMonthKey, number>>)[String(year)];
  if (!yearConfig) return 0;
  const monthKey = BS_MONTHS[month - 1];
  return yearConfig?.[monthKey] ?? 0;
}

function isValidBsDay(year: number, month: number, day: number) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const max = getMaxBsDay(year, month);
  return day <= max;
}

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

    // View state for BS
    const [viewYear, setViewYear] = React.useState<number>(2080);
    const [viewMonth, setViewMonth] = React.useState<number>(1);

    // View state for AD
    const [viewAdYear, setViewAdYear] = React.useState<number>(2024);
    const [viewAdMonth, setViewAdMonth] = React.useState<number>(1);

    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = useOutsideClick<HTMLDivElement>(() => setOpen(false), [buttonRef]);

    const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({
      position: "fixed",
      top: -9999,
      left: -9999,
      opacity: 0,
    });

    // Sync view states when value changes or when opening
    React.useEffect(() => {
      if (open) {
        if (preference === "BS" && value.bs) {
          const p = parseBs(value.bs);
          if (p) {
            setViewYear(p.year);
            setViewMonth(p.month);
          }
        } else if (preference === "AD" && value.ad) {
          const p = parseAd(value.ad);
          if (p) {
            setViewAdYear(p.year);
            setViewAdMonth(p.month);
          }
        } else {
          // Default to today
          const now = new Date();
          setViewAdYear(now.getFullYear());
          setViewAdMonth(now.getMonth() + 1);
          const bs = parseBs(adToBs(now.toISOString().slice(0, 10)));
          if (bs) {
            setViewYear(bs.year);
            setViewMonth(bs.month);
          }
        }

        // Update position
        const rect = buttonRef.current?.parentElement?.getBoundingClientRect();
        if (rect) {
          setMenuStyle({
            position: "fixed",
            top: rect.bottom + 8,
            left: rect.left,
            zIndex: 1000,
            opacity: 1,
          });
        }
      }
    }, [open, preference, value.ad, value.bs]);

    const todayAd = new Date().toISOString().slice(0, 10);
    const todayBs = adToBs(todayAd);

    // AD helpers
    const adHeaderLabel = React.useMemo(() => {
      const date = new Date(viewAdYear, viewAdMonth - 1, 1);
      return date.toLocaleString("en-US", { month: "long", year: "numeric" });
    }, [viewAdYear, viewAdMonth]);

    const bsHeaderLabel = React.useMemo(() => {
      try {
        const startAd = `${viewAdYear}-${pad(viewAdMonth)}-01`;
        const endAd = `${viewAdYear}-${pad(viewAdMonth)}-${new Date(viewAdYear, viewAdMonth, 0).getDate()}`;
        const startBs = parseBs(adToBs(startAd));
        const endBs = parseBs(adToBs(endAd));
        if (startBs && endBs) {
          if (startBs.month === endBs.month) {
            return `${BS_MONTHS[startBs.month - 1]} ${startBs.year}`;
          }
          return `${BS_MONTHS[startBs.month - 1]}/${BS_MONTHS[endBs.month - 1]} ${startBs.year}`;
        }
      } catch { return ""; }
      return "";
    }, [viewAdYear, viewAdMonth]);

    const adMonthDays = React.useMemo(() => {
      const days = new Date(viewAdYear, viewAdMonth, 0).getDate();
      return Array.from({ length: days }, (_, i) => i + 1);
    }, [viewAdYear, viewAdMonth]);

    const adFirstWeekday = React.useMemo(() => {
      return new Date(viewAdYear, viewAdMonth - 1, 1).getDay();
    }, [viewAdYear, viewAdMonth]);

    // BS helpers
    const adRangeLabel = React.useMemo(() => {
      try {
        const startAd = bsToAd(`${viewYear}-${pad(viewMonth)}-01`);
        const maxDay = getMaxBsDay(viewYear, viewMonth);
        const endAd = bsToAd(`${viewYear}-${pad(viewMonth)}-${pad(maxDay)}`);

        const start = new Date(startAd);
        const end = new Date(endAd);

        if (start.getMonth() === end.getMonth()) {
          return `${start.toLocaleString("en-US", { month: "short" })} ${start.getFullYear()}`;
        }
        return `${start.toLocaleString("en-US", { month: "short" })}/${end.toLocaleString("en-US", { month: "short" })} ${start.getFullYear()}`;
      } catch { return ""; }
    }, [viewYear, viewMonth]);

    const bsMonthDays = React.useMemo(() => {
      const days = getMaxBsDay(viewYear, viewMonth);
      return Array.from({ length: days }, (_, i) => i + 1);
    }, [viewYear, viewMonth]);

    const bsFirstWeekday = React.useMemo(() => {
      const ad = bsToAd(`${viewYear}-${pad(viewMonth)}-01`);
      return new Date(ad).getDay();
    }, [viewYear, viewMonth]);

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
        const parsed = parseAd(nextAd);
        if (!parsed) throw new Error("Invalid AD format");
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
        const parsed = parseBs(nextBs);
        if (!parsed || !isValidBsDay(parsed.year, parsed.month, parsed.day)) {
          throw new Error("Invalid BS day");
        }
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
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1">
          {label}
          {required ? " *" : ""}
        </label>

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
                  if (preference === "AD") handleAdCommit(localMain || value.ad || "");
                  else handleBsCommit(localMain || value.bs || "");
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
              <Calendar className="h-4 w-4" />
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
            className="w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Calendar Header */}
            <div className={cn("flex flex-col gap-0 px-4 py-3 text-white transition-colors duration-300", accentColor)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => preference === "BS" ? setViewYear(v => v - 1) : setViewAdYear(v => v - 1)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 opacity-50" />
                    <ChevronLeft className="h-4 w-4 -ml-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (preference === "BS") {
                        const next = viewMonth - 1;
                        if (next <= 0) { setViewYear(v => v - 1); setViewMonth(12); }
                        else setViewMonth(next);
                      } else {
                        const next = viewAdMonth - 1;
                        if (next <= 0) { setViewAdYear(v => v - 1); setViewAdMonth(12); }
                        else setViewAdMonth(next);
                      }
                    }}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-center">
                  <div className="text-sm font-black uppercase tracking-wide">
                    {preference === "BS" ? `${BS_MONTHS_NP[viewMonth - 1]} ${toNepaliDigits(viewYear)}` : adHeaderLabel}
                  </div>
                  <div className="text-[10px] font-bold opacity-70 uppercase tracking-tighter mt-0.5">
                    {preference === "BS" ? adRangeLabel : bsHeaderLabel}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (preference === "BS") {
                        const next = viewMonth + 1;
                        if (next > 12) { setViewYear(v => v + 1); setViewMonth(1); }
                        else setViewMonth(next);
                      } else {
                        const next = viewAdMonth + 1;
                        if (next > 12) { setViewAdYear(v => v + 1); setViewAdMonth(1); }
                        else setViewAdMonth(next);
                      }
                    }}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => preference === "BS" ? setViewYear(v => v + 1) : setViewAdYear(v => v + 1)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(preference === "BS" ? WEEK_DAYS_NP : ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]).map(d => (
                  <div key={d} className="text-center text-[8px] font-black uppercase opacity-60">
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 p-3">
              {Array.from({ length: (preference === "BS" ? bsFirstWeekday : adFirstWeekday) }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {(preference === "BS" ? bsMonthDays : adMonthDays).map(day => {
                const dateStr = preference === "BS"
                  ? `${viewYear}-${pad(viewMonth)}-${pad(day)}`
                  : `${viewAdYear}-${pad(viewAdMonth)}-${pad(day)}`;

                const isSelected = preference === "BS" ? value.bs === dateStr : value.ad === dateStr;
                const isToday = dateStr === (preference === "BS" ? todayBs : todayAd);

                const subLabel = preference === "BS" ? parseAd(bsToAd(dateStr))?.day : parseBs(adToBs(dateStr))?.day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const val = preference === "BS" ? dateStr : dateStr;
                      if (preference === "BS") handleBsCommit(val);
                      else handleAdCommit(val);
                      setOpen(false);
                      onEnterNext?.();
                    }}
                    className={cn(
                      "relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all group/day",
                      isSelected
                        ? cn("text-white shadow-lg", accentColor)
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
                      isToday && !isSelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900"
                    )}
                  >
                    <span className="text-xs font-black leading-none">
                      {preference === "BS" ? toNepaliDigits(day) : day}
                    </span>
                    <span className={cn(
                      "text-[8px] font-bold mt-0.5",
                      isSelected ? "text-white/70" : "text-slate-400"
                    )}>
                      {subLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{preference} Calendar</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreference(p => p === "BS" ? "AD" : "BS")}
                  className="text-[10px] font-black text-primary uppercase hover:underline"
                >
                  Switch to {preference === "BS" ? "AD" : "BS"}
                </button>
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                <button
                  type="button"
                  onClick={() => {
                    if (preference === "BS") handleBsCommit(todayBs);
                    else handleAdCommit(todayAd);
                    setOpen(false);
                  }}
                  className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                >
                  {preference === "BS" ? "आज" : "Today"}
                </button>
              </div>
            </div>
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
