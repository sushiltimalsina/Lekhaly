"use client";

import * as React from "react";
import { CalendarDays, ChevronDown, Filter, Play, Search } from "lucide-react";
import { Button, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import { DATE_RANGE_LABELS, type DateRangeKey, getDateRange } from "@/lib/dates/ranges";
import DualDateInput from "@/components/app/dual-date-input";
import { adToBs } from "@/lib/dates/convert";
import { getSettings, subscribeSettings, type CalendarPreference } from "@/lib/store/settings";

export type ReportFilterField = {
  key: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  hidden?: boolean;
  onChange: (value: string) => void;
};

type ReportFilterBarProps = {
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  dateRange?: DateRangeKey;
  onDateRangeChange?: (range: DateRangeKey, dates: { from: Date | null; to: Date | null }) => void;
  fields?: ReportFilterField[];
  onRun?: () => void;
  runLabel?: string;
  className?: string;
};

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDualDateValue(ad: string) {
  if (!ad) return { ad: "", bs: "" };
  try {
    return { ad, bs: adToBs(ad) };
  } catch {
    return { ad, bs: "" };
  }
}

function toStartOfDay(ad: string) {
  if (!ad) return null;
  const date = new Date(`${ad}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toEndOfDay(ad: string) {
  if (!ad) return null;
  const date = new Date(`${ad}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateByPreference(ad: string, preference: CalendarPreference) {
  if (!ad) return "";
  if (preference === "AD") return ad;
  try {
    return adToBs(ad);
  } catch {
    return ad;
  }
}

function formatCustomRangeLabel(from: string, to: string, preference: CalendarPreference) {
  const fromDisplay = formatDateByPreference(from, preference);
  const toDisplay = formatDateByPreference(to, preference);
  if (fromDisplay && toDisplay) return `${fromDisplay} to ${toDisplay} (${preference})`;
  if (fromDisplay) return `From ${fromDisplay} (${preference})`;
  if (toDisplay) return `To ${toDisplay} (${preference})`;
  return "Choose dates";
}

function formatRangeDates(from: Date | null, to: Date | null, preference: CalendarPreference) {
  return formatCustomRangeLabel(toDateInputValue(from), toDateInputValue(to), preference);
}

export default function ReportFilterBar({
  searchValue = "",
  onSearch,
  searchPlaceholder = "Search...",
  dateRange = "this_year",
  onDateRangeChange,
  fields = [],
  onRun,
  runLabel = "Run Report",
  className
}: ReportFilterBarProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const visibleFields = fields.filter((field) => !field.hidden);
  const [calendarPreference, setCalendarPreference] = React.useState<CalendarPreference>(() => getSettings().calendarPreference || "BS");
  const initialRange = React.useMemo(() => getDateRange(dateRange), [dateRange]);
  const [customFrom, setCustomFrom] = React.useState(toDateInputValue(initialRange.from));
  const [customTo, setCustomTo] = React.useState(toDateInputValue(initialRange.to));
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const [customOpen, setCustomOpen] = React.useState(dateRange === "custom");
  const selectedRangeDates = dateRange === "custom"
    ? formatCustomRangeLabel(customFrom, customTo, calendarPreference)
    : formatRangeDates(getDateRange(dateRange).from, getDateRange(dateRange).to, calendarPreference);

  const handleDateRangeChange = (value: DateRangeKey) => {
    if (value === "custom") {
      const dates = getDateRange("current_month");
      const nextFrom = toDateInputValue(dates.from);
      const nextTo = toDateInputValue(dates.to);
      setCustomFrom(nextFrom);
      setCustomTo(nextTo);
      setRangeOpen(false);
      setCustomOpen(true);
      onDateRangeChange?.(value, { from: toStartOfDay(nextFrom), to: toEndOfDay(nextTo) });
      return;
    }
    setRangeOpen(false);
    setCustomOpen(false);
    const dates = getDateRange(value);
    setCustomFrom(toDateInputValue(dates.from));
    setCustomTo(toDateInputValue(dates.to));
    onDateRangeChange?.(value, dates);
  };

  const handleCustomDateChange = (side: "from" | "to", ad: string) => {
    const nextFrom = side === "from" ? ad : customFrom;
    const nextTo = side === "to" ? ad : customTo;
    setCustomFrom(nextFrom);
    setCustomTo(nextTo);
    onDateRangeChange?.("custom", { from: toStartOfDay(nextFrom), to: toEndOfDay(nextTo) });
  };

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && !containerRef.current?.contains(target)) {
        setRangeOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeSettings((settings) => {
      setCalendarPreference(settings.calendarPreference || "BS");
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (dateRange === "custom") {
      onDateRangeChange?.(dateRange, { from: toStartOfDay(customFrom), to: toEndOfDay(customTo) });
      return;
    }
    onDateRangeChange?.(dateRange, getDateRange(dateRange));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className={cn("relative rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-2.5 xl:flex-nowrap">
        <div className="relative min-w-[240px] flex-[1_1_320px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearch?.(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-xl border-border/70 bg-background/80 pl-10"
          />
        </div>

        <div className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-transparent px-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setRangeOpen((open) => !open)}
            className="flex h-11 w-[300px] items-center justify-between gap-2 rounded-xl border border-border bg-background/90 px-3 text-left shadow-sm transition hover:border-orange-300 dark:hover:border-orange-500/60"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <CalendarDays className="h-3.5 w-3.5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Range</span>
                <span className="max-w-[220px] truncate text-xs font-black uppercase tracking-widest text-foreground">{DATE_RANGE_LABELS[dateRange]}</span>
                <span className="mt-0.5 max-w-[220px] truncate rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[9px] font-black leading-none text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200">
                  [{selectedRangeDates}]
                </span>
              </span>
            </span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", rangeOpen && "rotate-180")} />
          </button>

          {rangeOpen && (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[260px] overflow-hidden rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl shadow-black/10 dark:shadow-black/40">
              {(Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDateRangeChange(key)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold uppercase tracking-widest transition",
                    dateRange === key
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-500/15 dark:hover:text-orange-200"
                  )}
                >
                  <span>{DATE_RANGE_LABELS[key]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {visibleFields.map((field) => (
          <label key={field.key} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-background/90 px-3 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{field.label}</span>
            <select
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              className="max-w-[150px] bg-transparent text-xs font-black uppercase tracking-widest outline-none"
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ))}

        {onRun && (
          <Button onClick={onRun} className="h-11 shrink-0 rounded-xl px-5 xl:ml-auto">
            <Play className="mr-2 h-4 w-4" />
            {runLabel}
          </Button>
        )}
      </div>

      {dateRange === "custom" && customOpen && (
        <div className="absolute right-3 top-[calc(100%+0.6rem)] z-[65] w-[min(680px,calc(100vw-3rem))] rounded-2xl border border-orange-300 bg-orange-50 p-4 text-orange-950 shadow-2xl shadow-orange-950/10 dark:border-orange-500/40 dark:bg-orange-950 dark:text-orange-50 dark:shadow-black/50">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-300">Custom Date Range</div>
              <div className="text-xs font-semibold text-orange-900/70 dark:text-orange-100/70">Current month is loaded first. Pick From and To dates.</div>
            </div>
            <div className="w-fit rounded-full border border-orange-300 bg-white/70 px-2.5 py-1 text-[10px] font-black text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100">
              [{selectedRangeDates}]
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DualDateInput
              label="From Date"
              value={toDualDateValue(customFrom)}
              onChange={(next) => handleCustomDateChange("from", next.ad)}
              accentColor="bg-orange-600"
            />
            <DualDateInput
              label="To Date"
              value={toDualDateValue(customTo)}
              onChange={(next) => handleCustomDateChange("to", next.ad)}
              accentColor="bg-orange-600"
            />
          </div>
          <div className="mt-4 flex justify-end border-t border-orange-200 pt-3 dark:border-orange-500/20">
            <Button type="button" onClick={() => setCustomOpen(false)} className="rounded-xl bg-orange-600 text-white hover:bg-orange-700">
              Apply Custom Range
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
