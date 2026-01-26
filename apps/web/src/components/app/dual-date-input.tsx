"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { dateConfigMap } from "nepali-date-converter";
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
  const maxDay = getMaxBsDay(year, month);
  return maxDay > 0 && day <= maxDay;
}

function useCalendarPreference(): CalendarPreference {
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
  const [openAd, setOpenAd] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRefAd = React.useRef<HTMLDivElement>(null);
  const buttonRefAd = React.useRef<HTMLButtonElement>(null);

  const todayAd = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayBs = React.useMemo(() => {
    try {
      return adToBs(todayAd);
    } catch {
      return "";
    }
  }, [todayAd]);

  const selectedBs =
    parseBs(value.bs) ??
    (value.ad ? parseBs(safeAdToBs(value.ad)) : null) ??
    parseBs(todayBs);
  const [viewYear, setViewYear] = React.useState(selectedBs?.year ?? 2080);
  const [viewMonth, setViewMonth] = React.useState(selectedBs?.month ?? 1);

  React.useEffect(() => {
    if (!open) return;
    const next =
      parseBs(value.bs) ?? (value.ad ? parseBs(safeAdToBs(value.ad)) : null) ?? parseBs(todayBs);
    if (next) {
      setViewYear(next.year);
      setViewMonth(next.month);
    }
  }, [open, value.ad, value.bs, todayBs]);

  const selectedAd = parseAd(value.ad?.slice(0, 10) || "") ?? parseAd(todayAd);
  const [viewAdYear, setViewAdYear] = React.useState(
    selectedAd?.year ?? new Date().getUTCFullYear()
  );
  const [viewAdMonth, setViewAdMonth] = React.useState(
    selectedAd?.month ?? new Date().getUTCMonth() + 1
  );

  React.useEffect(() => {
    if (!openAd) return;
    const next = parseAd(value.ad?.slice(0, 10) || "") ?? parseAd(todayAd);
    if (next) {
      setViewAdYear(next.year);
      setViewAdMonth(next.month);
    }
  }, [openAd, value.ad, todayAd]);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      const inPanel = panelRef.current?.contains(target);
      const inButton = buttonRef.current?.contains(target);
      const inPanelAd = panelRefAd.current?.contains(target);
      const inButtonAd = buttonRefAd.current?.contains(target);
      if (!inPanel && !inButton) setOpen(false);
      if (!inPanelAd && !inButtonAd) setOpenAd(false);
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
    const maxDay = getMaxBsDay(year, month);
    if (maxDay <= 0) return [];
    return Array.from({ length: maxDay }, (_, i) => i + 1);
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
  const firstWeekday = React.useMemo(
    () => getFirstWeekday(viewYear, viewMonth),
    [viewYear, viewMonth]
  );
  const adRangeLabel = React.useMemo(() => {
    try {
      const maxDay = getMaxBsDay(viewYear, viewMonth);
      if (maxDay <= 0) return "";
      const startAd = bsToAd(`${viewYear}-${pad(viewMonth)}-01`);
      const endAd = bsToAd(`${viewYear}-${pad(viewMonth)}-${pad(maxDay)}`);
      const startDate = new Date(`${startAd}T00:00:00Z`);
      const endDate = new Date(`${endAd}T00:00:00Z`);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "";
      const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
      const yearFmt = new Intl.DateTimeFormat("en-US", { year: "numeric" });
      const startMonth = monthFmt.format(startDate);
      const endMonth = monthFmt.format(endDate);
      const yearLabel = yearFmt.format(endDate);
      const monthLabel = startMonth === endMonth ? startMonth : `${startMonth}/${endMonth}`;
      return `${monthLabel} ${yearLabel}`;
    } catch {
      return "";
    }
  }, [viewMonth, viewYear]);

  function getDaysInAdMonth(year: number, month: number) {
    if (!Number.isFinite(year) || !Number.isFinite(month)) return [];
    const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return Array.from({ length: maxDay }, (_, i) => i + 1);
  }

  function getFirstWeekdayAd(year: number, month: number) {
    const dt = new Date(Date.UTC(year, month - 1, 1));
    return dt.getUTCDay();
  }

  const adMonthDays = React.useMemo(
    () => getDaysInAdMonth(viewAdYear, viewAdMonth),
    [viewAdMonth, viewAdYear]
  );
  const adFirstWeekday = React.useMemo(
    () => getFirstWeekdayAd(viewAdYear, viewAdMonth),
    [viewAdMonth, viewAdYear]
  );
  const adHeaderLabel = React.useMemo(() => {
    const dt = new Date(Date.UTC(viewAdYear, viewAdMonth - 1, 1));
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(dt);
  }, [viewAdMonth, viewAdYear]);
  const bsHeaderLabel = React.useMemo(() => {
    try {
      const maxDay = new Date(Date.UTC(viewAdYear, viewAdMonth, 0)).getUTCDate();
      const startBs = parseBs(adToBs(`${viewAdYear}-${pad(viewAdMonth)}-01`));
      const endBs = parseBs(adToBs(`${viewAdYear}-${pad(viewAdMonth)}-${pad(maxDay)}`));
      if (!startBs || !endBs) return "";
      const startMonth = BS_MONTHS_NP[startBs.month - 1];
      const endMonth = BS_MONTHS_NP[endBs.month - 1];
      const startYear = toNepaliDigits(startBs.year);
      const endYear = toNepaliDigits(endBs.year);
      if (startMonth === endMonth && startBs.year === endBs.year) {
        return `${startMonth} ${startYear}`;
      }
      if (startBs.year === endBs.year) {
        return `${startMonth}/${endMonth} ${endYear}`;
      }
      return `${startMonth} ${startYear}/${endMonth} ${endYear}`;
    } catch {
      return "";
    }
  }, [viewAdMonth, viewAdYear]);

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
      const parsed = parseBs(nextBs);
      if (!parsed || !isValidBsDay(parsed.year, parsed.month, parsed.day)) {
        throw new Error("Invalid BS day");
      }
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
        <div className="relative">
          <Input
            type="text"
            value={localMain || value.ad?.slice(0, 10) || ""}
            onChange={(e) => setLocalMain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdCommit(localMain || value.ad || "");
                setLocalMain("");
                setOpenAd(false);
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
            className="pr-10 rounded-xl"
            onFocus={() => setOpenAd(true)}
          />
          <button
            type="button"
            ref={buttonRefAd}
            onClick={() => setOpenAd((v) => !v)}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <Calendar className="h-4 w-4" />
          </button>

          {openAd ? (
            <div
              ref={panelRefAd}
              className="absolute z-30 mt-2 w-[320px] overflow-hidden rounded-2xl border bg-card shadow-xl"
            >
              <div className="flex items-center justify-between bg-emerald-600 px-3 py-2 text-white">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewAdYear((y) => y - 1)}
                    className="rounded-md px-1 py-0.5 text-xs hover:bg-white/10"
                  >
                    {"<<"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMonth = viewAdMonth - 1;
                      if (nextMonth <= 0) {
                        setViewAdYear(viewAdYear - 1);
                        setViewAdMonth(12);
                      } else {
                        setViewAdMonth(nextMonth);
                      }
                    }}
                    className="rounded-md p-1 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-center text-sm font-semibold">
                  <div>{adHeaderLabel}</div>
                  <div className="text-[11px] text-white/80">{bsHeaderLabel}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nextMonth = viewAdMonth + 1;
                      if (nextMonth > 12) {
                        setViewAdYear(viewAdYear + 1);
                        setViewAdMonth(1);
                      } else {
                        setViewAdMonth(nextMonth);
                      }
                    }}
                    className="rounded-md p-1 hover:bg-white/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewAdYear((y) => y + 1)}
                    className="rounded-md px-1 py-0.5 text-xs hover:bg-white/10"
                  >
                    {">>"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 px-3 pt-2 text-[11px] text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-1 text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1 px-3 pb-2 text-sm">
                {Array.from({ length: adFirstWeekday }).map((_, i) => (
                  <div key={`ad-empty-${i}`} />
                ))}
                {adMonthDays.map((day) => {
                  const adValue = `${viewAdYear}-${pad(viewAdMonth)}-${pad(day)}`;
                  const selected = value.ad?.slice(0, 10) === adValue;
                  let bsDayLabel = "";
                  try {
                    const bs = parseBs(adToBs(adValue));
                    if (bs) bsDayLabel = toNepaliDigits(bs.day);
                  } catch {
                    bsDayLabel = "";
                  }
                  return (
                    <button
                      key={adValue}
                      type="button"
                      onClick={() => {
                        handleAdCommit(adValue);
                        setOpenAd(false);
                        onEnterNext?.();
                      }}
                      className={cn(
                        "rounded-lg py-1 text-center transition",
                        selected
                          ? "bg-emerald-600 text-white"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span>{day}</span>
                        <span
                          className={cn(
                            "text-[10px]",
                            selected ? "text-white/80" : "text-muted-foreground/70"
                          )}
                        >
                          {bsDayLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                <span>AD</span>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  onClick={() => {
                    handleAdCommit(todayAd);
                    setOpenAd(false);
                  }}
                >
                  Today
                </button>
              </div>
            </div>
          ) : null}
        </div>
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
                setOpen(false);
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
              className="absolute z-30 mt-2 w-[320px] overflow-hidden rounded-2xl border bg-card shadow-xl"
            >
              <div className="flex items-center justify-between bg-emerald-600 px-3 py-2 text-white">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y - 1)}
                    className="rounded-md px-1 py-0.5 text-xs hover:bg-white/10"
                  >
                    {"<<"}
                  </button>
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
                    className="rounded-md p-1 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-center text-sm font-semibold">
                  <div>
                    {BS_MONTHS_NP[viewMonth - 1]} {toNepaliDigits(viewYear)}
                  </div>
                  <div className="text-[11px] text-white/80">{adRangeLabel}</div>
                </div>
                <div className="flex items-center gap-1">
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
                    className="rounded-md p-1 hover:bg-white/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y + 1)}
                    className="rounded-md px-1 py-0.5 text-xs hover:bg-white/10"
                  >
                    {">>"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 px-3 pt-2 text-[11px] text-muted-foreground">
                {WEEK_DAYS_NP.map((d) => (
                  <div key={d} className="py-1 text-center">
                    {d}
                  </div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1 px-3 pb-2 text-sm">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {monthDays.map((day) => {
                  const bsValue = `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
                  const selected = value.bs === bsValue;
                  let adDayLabel = "";
                  try {
                    const ad = bsToAd(bsValue);
                    adDayLabel = String(new Date(`${ad}T00:00:00Z`).getUTCDate());
                  } catch {
                    adDayLabel = "";
                  }
                  return (
                    <button
                      key={bsValue}
                      type="button"
                      onClick={() => {
                        handleBsCommit(bsValue);
                        setOpen(false);
                        onEnterNext?.();
                      }}
                      className={cn(
                        "rounded-lg py-1 text-center transition",
                        selected
                          ? "bg-emerald-600 text-white"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span>{toNepaliDigits(day)}</span>
                        <span
                          className={cn(
                            "text-[10px]",
                            selected ? "text-white/80" : "text-muted-foreground/70"
                          )}
                        >
                          {adDayLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
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
                  आज
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
