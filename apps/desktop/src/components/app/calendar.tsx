"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateConfigMap } from "nepali-date-converter";
import { cn } from "@/lib/utils";
import { adToBs, bsToAd } from "@/lib/dates/convert";
import { getSettings, subscribeSettings, type CalendarPreference } from "@/lib/store/settings";

const BS_MONTHS = [
    "Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Aswin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
] as const;

const BS_MONTHS_NP = [
    "बैशाख", "जेठ", "असार", "श्रावण", "भाद्र", "आश्विन",
    "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुण", "चैत्र",
] as const;

const WEEK_DAYS_NP = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];
const WEEK_DAYS_AD = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type BsMonthKey = (typeof BS_MONTHS)[number];

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

function getMaxBsDay(year: number, month: number) {
    if (month < 1 || month > 12) return 0;
    const yearConfig = (dateConfigMap as Record<string, Record<BsMonthKey, number>>)[String(year)];
    if (!yearConfig) return 0;
    const monthKey = BS_MONTHS[month - 1];
    return yearConfig?.[monthKey] ?? 0;
}

interface CalendarProps {
    value?: string; // ISO Date YYYY-MM-DD
    onChange?: (date: string) => void;
    preference?: CalendarPreference; // If provided, overrides settings
    accentColor?: string;
    className?: string;
}

export function Calendar({
    value,
    onChange,
    preference: externalPreference,
    accentColor = "bg-primary",
    className
}: CalendarProps) {
    const [preference, setPreference] = React.useState<CalendarPreference>(
        externalPreference || getSettings().calendarPreference || "BS"
    );

    React.useEffect(() => {
        if (externalPreference) {
            setPreference(externalPreference);
            return;
        }
        const unsubscribe = subscribeSettings((s) => {
            if (s.calendarPreference) setPreference(s.calendarPreference);
        });
        return () => {
            unsubscribe();
        };
    }, [externalPreference]);

    const [viewYear, setViewYear] = React.useState(2080);
    const [viewMonth, setViewMonth] = React.useState(1);
    const [viewAdYear, setViewAdYear] = React.useState(new Date().getFullYear());
    const [viewAdMonth, setViewAdMonth] = React.useState(new Date().getMonth() + 1);

    // Sync view when value changes
    React.useEffect(() => {
        const d = value ? new Date(value) : new Date();
        if (isNaN(d.getTime())) return;

        setViewAdYear(d.getFullYear());
        setViewAdMonth(d.getMonth() + 1);

        try {
            const bs = adToBs(d.toISOString().slice(0, 10)).split("-");
            setViewYear(parseInt(bs[0]));
            setViewMonth(parseInt(bs[1]));
        } catch {
            // Fallback
        }
    }, [value]);

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
            const startBs = adToBs(startAd).split("-");
            const endBs = adToBs(endAd).split("-");

            const startMonth = BS_MONTHS[parseInt(startBs[1]) - 1];
            const endMonth = BS_MONTHS[parseInt(endBs[1]) - 1];

            if (startBs[1] === endBs[1]) {
                return `${startMonth} ${startBs[0]}`;
            }
            return `${startMonth}/${endMonth} ${startBs[0]}`;
        } catch { return ""; }
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
            const startAdStr = bsToAd(`${viewYear}-${pad(viewMonth)}-01`);
            const maxDay = getMaxBsDay(viewYear, viewMonth);
            const endAdStr = bsToAd(`${viewYear}-${pad(viewMonth)}-${pad(maxDay)}`);

            const start = new Date(startAdStr);
            const end = new Date(endAdStr);

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
        try {
            const ad = bsToAd(`${viewYear}-${pad(viewMonth)}-01`);
            return new Date(ad).getDay();
        } catch { return 0; }
    }, [viewYear, viewMonth]);

    const handleSelect = (day: number) => {
        let dateStr = "";
        if (preference === "BS") {
            dateStr = bsToAd(`${viewYear}-${pad(viewMonth)}-${pad(day)}`);
        } else {
            dateStr = `${viewAdYear}-${pad(viewAdMonth)}-${pad(day)}`;
        }
        onChange?.(dateStr);
    };

    return (
        <div className={cn("w-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900", className)}>
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
                    {(preference === "BS" ? WEEK_DAYS_NP : WEEK_DAYS_AD).map(d => (
                        <div key={d} className="text-center text-[8px] font-black uppercase opacity-60">
                            {d}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 p-3">
                {Array.from({ length: (preference === "BS" ? bsFirstWeekday : adFirstWeekday) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {(preference === "BS" ? bsMonthDays : adMonthDays).map(day => {
                    const dateStr = preference === "BS"
                        ? `${viewYear}-${pad(viewMonth)}-${pad(day)}`
                        : `${viewAdYear}-${pad(viewAdMonth)}-${pad(day)}`;

                    // For selection and secondary label calculation
                    let currentAd = "";
                    let currentBs = "";
                    try {
                        if (preference === "BS") {
                            currentAd = bsToAd(dateStr);
                            currentBs = dateStr;
                        } else {
                            currentAd = dateStr;
                            currentBs = adToBs(dateStr);
                        }
                    } catch { return null; }

                    const isSelected = value === currentAd;
                    const isToday = currentAd === todayAd;

                    // Extract day number for the secondary label
                    const secondaryDay = (preference === "BS" ? currentAd : currentBs).split("-")[2];
                    const secondaryLabel = preference === "AD" ? toNepaliDigits(parseInt(secondaryDay)) : parseInt(secondaryDay);

                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => handleSelect(day)}
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
                                "text-[8px] font-bold mt-0.5 opacity-60",
                                isSelected ? "text-white" : "text-slate-400"
                            )}>
                                {secondaryLabel}
                            </span>
                        </button>
                    );
                })}
            </div>

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
                        onClick={() => onChange?.(todayAd)}
                        className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                    >
                        {preference === "BS" ? "आज" : "Today"}
                    </button>
                </div>
            </div>
        </div>
    );
}

