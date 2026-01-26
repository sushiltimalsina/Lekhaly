"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { adToBs, bsToAd } from "@/lib/dates/convert";
import { formatDisplayDate } from "@/lib/dates/display";
import { getSettings, subscribeSettings } from "@/lib/store/settings";

type DualDateValue = { ad: string; bs: string };
type CalendarPreference = "BS" | "AD";

type DualDateInputProps = {
  label: string;
  value: DualDateValue;
  onChange: (next: DualDateValue) => void;
  preferred?: CalendarPreference;
  required?: boolean;
  disabled?: boolean;
  onEnterNext?: () => void;
};

const BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return String(n).padStart(2, "0");
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

function useCalendarPreference() {
  return React.useSyncExternalStore(
    subscribeSettings,
    () => getSettings().calendarPreference,
    () => "BS"
  );
}

export default function DualDateInput({
  label,
  value,
  onChange,
  preferred,
  required,
  disabled,
  onEnterNext,
}: DualDateInputProps) {
  const storePref = useCalendarPreference();
  const preference = preferred ?? storePref;

  const [error, setError] = React.useState<string | null>(null);
  const [localMain, setLocalMain] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const todayAd = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayBs = React.useMemo(() => {
    try {
      return adToBs(todayAd);
    } catch {
      return "";
    }
  }, [todayAd]);

  const selectedBs = parseBs(value.bs) ?? (value.ad ? parseBs(safeAdToBs(value.ad)) : null) ?? parseBs(todayBs);
  const [viewYear, setViewYear] = React.useState(selectedBs?.year ?? 2080);
  const [viewMonth, setViewMonth] = React.useState(selectedBs?.month ?? 1);

  React.useEffect(() => {
    if (!open) return;
    const next = parseBs(value.bs) ?? (value.ad ? parseBs(safeAdToBs(value.ad)) : null) ?? parseBs(todayBs);
    if (next) {
      setViewYear(next.year);
      setViewMonth(next.month);
    }
  }, [open, value.ad, value.bs, todayBs]);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      const inPanel = panelRef.current?.contains(target);
      const inButton = buttonRef.current?.contains(target);
      if (!inPanel && !inButton) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function safeAdToBs(ad: string) {
    try {
      return adToBs(ad);
    } catch {
      return "";
    }
  }

  function getDaysInMonth(year: number, month: number) {
    const days: number[] = [];
    for (let d = 1; d <= 32; d += 1) {
      try {
        bsToAd(`${year}-${pad(month)}-${pad(d)}`);
        days.push(d);
      } catch {
        break;
      }
    }
    return days;
  }

  function getFirstWeekday(year: number, month: number) {
    try {
      const ad = bsToAd(`${year}-${pad(month)}-01`);
      const dt = new Date(`${ad}T00:00:00Z`);
      return dt.getUTCDay();
    } catch {
      return 0;
    }
  }

  const monthDays = React.useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstWeekday = React.useMemo(() => getFirstWeekday(viewYear, viewMonth), [viewYear, viewMonth]);

  const display = formatDisplayDate(value, preference);
  const secondaryLabel = preference === "AD" ? "BS" : "AD";

  const handleAdCommit = (nextAd: string) => {
    if (!nextAd) {
      setError(null);
      onChange({ ad: "", bs: "" });
      return;
    }
    try {
      const nextBs = adToBs(nextAd);
      setError(null);
      onChange({ ad: nextAd, bs: nextBs });
    } catch {
      setError("Invalid AD date");
      onChange({ ad: nextAd, bs: value.bs });
    }
  };

  const handleBsCommit = (nextBs: string) => {
    if (!nextBs) {
      setError(null);
      onChange({ ad: "", bs: "" });
      return;
    }
    try {
      const nextAd = bsToAd(nextBs);
      setError(null);
      onChange({ ad: nextAd, bs: nextBs });
    } catch {
      setError("Invalid BS date");
      onChange({ ad: value.ad, bs: nextBs });
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </label>

      {preference === "AD" ? (
        <Input
          type="text"
          value={localMain || value.ad?.slice(0, 10) || ""}
          onChange={(e) => setLocalMain(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdCommit(localMain || value.ad || "");
              setLocalMain("");
              onEnterNext?.();
            }
          }}
          onBlur={() => {
            if (localMain) {
              handleAdCommit(localMain);
              setLocalMain("");
            }
          }}
          placeholder="YYYY-MM-DD"
          disabled={disabled}
          className="rounded-xl"
        />
      ) : (
        <div className="relative">
          <Input
            value={localMain || value.bs || ""}
            onChange={(e) => setLocalMain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleBsCommit(localMain || value.bs || "");
                setLocalMain("");
                onEnterNext?.();
              }
            }}
            onBlur={() => {
              if (localMain) {
                handleBsCommit(localMain);
                setLocalMain("");
              }
            }}
            placeholder="YYYY-MM-DD"
            disabled={disabled}
            className="pr-10 rounded-xl"
            onFocus={() => setOpen(true)}
          />
          <button
            type="button"
            ref={buttonRef}
            onClick={() => setOpen((v) => !v)}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <Calendar className="h-4 w-4" />
          </button>

          {open ? (
            <div
              ref={panelRef}
              className="absolute z-30 mt-2 w-[320px] rounded-2xl border bg-card p-3 shadow-xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const nextMonth = viewMonth - 1;
                    if (nextMonth <= 0) {
                      setViewYear(viewYear - 1);
                      setViewMonth(12);
                    } else {
                      setViewMonth(nextMonth);
                    }
                  }}
                  className="rounded-md p-1 hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-sm font-semibold">
                  {BS_MONTHS[viewMonth - 1]} {viewYear}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextMonth = viewMonth + 1;
                    if (nextMonth > 12) {
                      setViewYear(viewYear + 1);
                      setViewMonth(1);
                    } else {
                      setViewMonth(nextMonth);
                    }
                  }}
                  className="rounded-md p-1 hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-[11px] text-muted-foreground">
                {WEEK_DAYS.map((d) => (
                  <div key={d} className="py-1 text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1 text-sm">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {monthDays.map((day) => {
                  const bsValue = `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
                  const selected = value.bs === bsValue;
                  return (
                    <button
                      key={bsValue}
                      type="button"
                      onClick={() => {
                        handleBsCommit(bsValue);
                        setOpen(false);
                      }}
                      className={cn(
                        "rounded-lg py-1 text-center transition",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>BS</span>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  onClick={() => {
                    if (todayBs) {
                      handleBsCommit(todayBs);
                      setOpen(false);
                    }
                  }}
                >
                  Today
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {secondaryLabel}: {display.secondary}
      </div>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
