"use client";

import * as React from "react";
import { Filter, Play, Search } from "lucide-react";
import { Button, Input } from "@lekhaly/ui";
import { cn } from "@/lib/utils";
import { DATE_RANGE_LABELS, type DateRangeKey, getDateRange } from "@/lib/dates/ranges";

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
  const visibleFields = fields.filter((field) => !field.hidden);

  const handleDateRangeChange = (value: DateRangeKey) => {
    onDateRangeChange?.(value, getDateRange(value));
  };

  React.useEffect(() => {
    onDateRangeChange?.(dateRange, getDateRange(dateRange));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("rounded-[24px] border border-border/60 bg-card/80 p-4 shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearch?.(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-2xl pl-10"
          />
        </div>

        <div className="flex items-center gap-2 px-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters:
        </div>

        <label className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-background px-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Range</span>
          <select
            value={dateRange}
            onChange={(event) => handleDateRangeChange(event.target.value as DateRangeKey)}
            className="bg-transparent text-xs font-black uppercase tracking-widest outline-none"
          >
            {(Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]).filter((key) => key !== "custom").map((key) => (
              <option key={key} value={key}>{DATE_RANGE_LABELS[key]}</option>
            ))}
          </select>
        </label>

        {visibleFields.map((field) => (
          <label key={field.key} className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-background px-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{field.label}</span>
            <select
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none"
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ))}

        {onRun && (
          <Button onClick={onRun} className="h-11 rounded-2xl px-6">
            <Play className="mr-2 h-4 w-4" />
            {runLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
