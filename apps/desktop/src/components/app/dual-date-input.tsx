// apps/desktop/src/components/app/dual-date-input.tsx
import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { adToBs, bsToAd } from "@/lib/dates/convert";
import { formatDisplayDate } from "@/lib/dates/display";
import { getSettings, subscribeSettings, type CalendarPreference } from "@/lib/store/settings";
import { Calendar as CalendarPicker } from "./calendar";

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
  accentColor?: string;
};

export function DualDateInput({
  label,
  value,
  onChange,
  preferred,
  required,
  disabled,
  onEnterNext,
  className,
  accentColor = "bg-primary",
}: DualDateInputProps) {
  const [preference, setPreference] = React.useState<CalendarPreference>(
    preferred || getSettings().calendarPreference || "BS"
  );

  React.useEffect(() => {
    const unsubscribe = subscribeSettings((s) => {
      if (s.calendarPreference) setPreference(s.calendarPreference);
    });
    return () => { unsubscribe(); };
  }, []);

  const [open, setOpen] = React.useState(false);
  const [localMain, setLocalMain] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const display = React.useMemo(() => {
    const formatted = formatDisplayDate(value, preference);
    return {
      main: formatted.primary === "--" ? "" : formatted.primary,
      secondary: formatted.secondary,
    };
  }, [preference, value.ad, value.bs]);

  const handleCommit = (val: string) => {
    if (!val) {
      setError(null);
      onChange({ ad: "", bs: "" });
      return;
    }
    try {
      if (preference === "AD") {
        const bs = adToBs(val);
        setError(null);
        onChange({ ad: val, bs });
      } else {
        const ad = bsToAd(val).toISOString().slice(0, 10);
        setError(null);
        onChange({ ad, bs: val });
      }
    } catch {
      setError(`Invalid ${preference} date`);
    }
  };

  return (
    <div className={cn("space-y-1 relative", className)} ref={containerRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
        {label}
        {required ? " *" : ""}
      </label>

      <div className="relative">
        <Input
          type="text"
          value={localMain || display.main || ""}
          onChange={(e) => setLocalMain(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCommit(localMain || display.main);
              setLocalMain("");
              setOpen(false);
              onEnterNext?.();
            }
          }}
          onBlur={() => {
            if (localMain) {
              handleCommit(localMain);
              setLocalMain("");
            }
          }}
          placeholder="YYYY-MM-DD"
          disabled={disabled}
          className="h-10 rounded-xl pr-10 transition-all font-mono font-medium"
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 transition-all"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-2 z-50 w-[300px] shadow-2xl animate-in fade-in zoom-in-95">
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
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between px-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase">
          {preference === "AD" ? "BS" : "AD"}: <span className="text-slate-600 dark:text-slate-300 font-black">{display.secondary || "N/A"}</span>
        </div>
        {error && <div className="text-[9px] font-bold text-rose-500 uppercase">{error}</div>}
      </div>
    </div>
  );
}
