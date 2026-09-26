"use client";

import * as React from "react";
import {
    ChevronDown,
    Filter,
    Search,
    X,
    Plus,
    ChevronRight,
    Settings2,
    Eye,
    EyeOff,
    Check,
    RotateCcw,
    SlidersHorizontal,
    Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Input } from "@lekhaly/ui";
import { DualDateInput } from "@/components/app/dual-date-input";
import { Calendar } from "@/components/app/calendar";
import { adToBs } from "@/lib/dates/convert";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@lekhaly/ui";
import { DATE_RANGE_LABELS, DateRangeKey, getDateRange } from "@/lib/dates/ranges";
import { motion, AnimatePresence } from "framer-motion";
import { useDateFormat } from "@/lib/date-format";
import {
    AdvancedFilterBarProps,
    FilterBarConfig,
    FilterOptionDef,
    ColumnOptionDef,
    FilterValueState
} from "./filters/types";
import { getThemeClasses } from "./filters/theme-utils";

export type {
    FilterOptionDef as FilterOption,
    ColumnOptionDef as ColumnOption,
    FilterBarConfig,
    FilterValueState,
    AdvancedFilterBarProps
};

export default function AdvancedFilterBar(props: AdvancedFilterBarProps) {
    const { dateFormat } = useDateFormat();

    const legacyFilterOptions = (props.filterOptions || []) as FilterOptionDef[];
    const legacyColumnOptions = (props.columnOptions || []) as ColumnOptionDef[];

    const config: FilterBarConfig = React.useMemo(() => {
        if (props.config) return props.config;
        return {
            search: {
                enabled: !!(props.onSearch || props.searchValue !== undefined || props.initialSearch !== undefined),
                placeholder: "Search...",
            },
            dateRange: {
                enabled: true,
                defaultRange: props.defaultRange || "this_year",
                allowCustom: true,
                allowComparison: props.showComparison ?? false,
            },
            filters: legacyFilterOptions,
            columns: legacyColumnOptions,
            theme: {
                accentColor: "indigo",
                density: "comfortable",
            }
        };
    }, [props.config, props.onSearch, props.searchValue, props.initialSearch, props.defaultRange, props.showComparison, legacyFilterOptions, legacyColumnOptions]);

    const theme = getThemeClasses(config.theme?.accentColor || "indigo");
    const defaultRangeKey = config.dateRange?.defaultRange || "this_year";

    const [internalSearch, setInternalSearch] = React.useState(props.initialSearch || "");
    const searchValue = props.searchValue !== undefined ? props.searchValue : internalSearch;

    const [activeDateRange, setActiveDateRange] = React.useState<DateRangeKey>(defaultRangeKey);
    const [selectedFilters, setSelectedFilters] = React.useState<Record<string, any>>(config.defaultValues || {});
    const [isCustomDateOpen, setIsCustomDateOpen] = React.useState(false);
    const [compareEnabled, setCompareEnabled] = React.useState(false);

    const defaultColumns = React.useMemo(() => {
        const cols = config.columns || [];
        return cols.filter(c => c.defaultVisible !== false).map(c => c.key);
    }, [config.columns]);

    const [visibleColumns, setVisibleColumns] = React.useState<string[]>(defaultColumns);

    const [tempCustomRange, setTempCustomRange] = React.useState<{ from: string, to: string }>({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const notifyChange = React.useCallback((
        filters: Record<string, any>,
        rangeKey: DateRangeKey,
        compare: boolean,
        cols: string[],
        searchVal: string
    ) => {
        const range = getDateRange(rangeKey, dateFormat);
        const statePayload: FilterValueState = {
            search: searchVal,
            dateRange: { ...range, key: rangeKey },
            compare,
            filters,
            visibleColumns: cols,
        };

        props.onChange?.(statePayload);
        props.onFilterChange?.({
            ...filters,
            dateRange: range,
            compare,
            search: searchVal,
        });
    }, [dateFormat, props.onChange, props.onFilterChange]);

    React.useEffect(() => {
        notifyChange(selectedFilters, defaultRangeKey, compareEnabled, visibleColumns, searchValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearchChange = (val: string) => {
        setInternalSearch(val);
        props.onSearch?.(val);
        notifyChange(selectedFilters, activeDateRange, compareEnabled, visibleColumns, val);
    };

    const handleDateRangeSelect = (key: DateRangeKey) => {
        if (key === "custom") {
            setIsCustomDateOpen(true);
            return;
        }
        setActiveDateRange(key);
        notifyChange(selectedFilters, key, compareEnabled, visibleColumns, searchValue);
    };

    const handleCompareToggle = () => {
        const next = !compareEnabled;
        setCompareEnabled(next);
        props.onComparisonChange?.(next);
        notifyChange(selectedFilters, activeDateRange, next, visibleColumns, searchValue);
    };

    const handleApplyCustomRange = () => {
        setActiveDateRange("custom");
        notifyChange(selectedFilters, "custom", compareEnabled, visibleColumns, searchValue);
        setIsCustomDateOpen(false);
    };

    const handleFilterSelect = (key: string, value: any) => {
        const current = selectedFilters[key] || [];
        const filterDef = (config.filters || []).find(f => f.key === key);
        const isSingleSelect = filterDef?.type === "select" || filterDef?.multiple === false;

        let updated: any;
        if (isSingleSelect) {
            updated = Array.isArray(current) && current.includes(value) ? [] : [value];
        } else if (Array.isArray(current)) {
            updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
        } else {
            updated = [value];
        }

        const newFilters = { ...selectedFilters, [key]: updated };
        setSelectedFilters(newFilters);
        notifyChange(newFilters, activeDateRange, compareEnabled, visibleColumns, searchValue);
    };

    const handleRangeAmountChange = (key: string, field: "min" | "max", value: string) => {
        const current = selectedFilters[key] || { min: "", max: "" };
        const updated = { ...current, [field]: value };
        const newFilters = { ...selectedFilters, [key]: updated };
        setSelectedFilters(newFilters);
        notifyChange(newFilters, activeDateRange, compareEnabled, visibleColumns, searchValue);
    };

    const handleToggleColumn = (key: string) => {
        const colDef = (config.columns || []).find(c => c.key === key);
        if (colDef?.locked) return;

        const next = visibleColumns.includes(key)
            ? visibleColumns.filter(c => c !== key)
            : [...visibleColumns, key];
        setVisibleColumns(next);
        props.onVisibleColumnsChange?.(next);
        notifyChange(selectedFilters, activeDateRange, compareEnabled, next, searchValue);
    };

    const handleResetColumns = () => {
        setVisibleColumns(defaultColumns);
        props.onVisibleColumnsChange?.(defaultColumns);
        notifyChange(selectedFilters, activeDateRange, compareEnabled, defaultColumns, searchValue);
    };

    const removeFilterItem = (key: string, value?: string) => {
        const newFilters = { ...selectedFilters };
        if (value && Array.isArray(newFilters[key])) {
            newFilters[key] = newFilters[key].filter((v: string) => v !== value);
            if (newFilters[key].length === 0) delete newFilters[key];
        } else {
            delete newFilters[key];
        }
        setSelectedFilters(newFilters);
        notifyChange(newFilters, activeDateRange, compareEnabled, visibleColumns, searchValue);
    };

    const handleClearAll = () => {
        const defaults = config.defaultValues || {};
        setSelectedFilters(defaults);
        setActiveDateRange(defaultRangeKey);
        setInternalSearch("");
        props.onSearch?.("");
        notifyChange(defaults, defaultRangeKey, compareEnabled, visibleColumns, "");
    };

    const allFilters = config.filters || [];
    const primaryFilters = allFilters.filter(f => f.priority !== "secondary");
    const secondaryFilters = allFilters.filter(f => f.priority === "secondary");

    const activeFilterCount = Object.entries(selectedFilters).reduce((acc, [_, val]) => {
        if (!val) return acc;
        if (Array.isArray(val)) return acc + val.length;
        if (typeof val === "object" && (val.min || val.max)) return acc + 1;
        return acc + 1;
    }, 0);

    const isSearchEnabled = config.search?.enabled !== false;
    const isDateEnabled = config.dateRange?.enabled !== false;

    return (
        <div className={cn("flex flex-col gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all", props.className)}>
            <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                {isSearchEnabled && (
                    <div className="relative flex-1 min-w-[240px] max-w-md group">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder={config.search?.placeholder || "Search..."}
                            value={searchValue}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className={cn(
                                "pl-10 pr-8 h-9 text-xs rounded-xl bg-slate-50/70 border-slate-200/80 hover:border-slate-300 focus:border-indigo-500 transition-all dark:bg-slate-800/40 dark:border-slate-700/80",
                                theme.borderFocus
                            )}
                        />
                        {searchValue ? (
                            <button
                                onClick={() => handleSearchChange("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </div>
                )}

                {/* Date Range */}
                {isDateEnabled && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 group hover:border-indigo-300 transition-all relative h-9">
                        <CalendarIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Date:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors outline-none">
                                    {activeDateRange === "custom" ? "Custom Range" : DATE_RANGE_LABELS[activeDateRange]}
                                    <ChevronDown className="h-3 w-3 text-slate-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-52 max-h-[380px] overflow-y-auto">
                                {(Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]).map((key) => (
                                    <DropdownMenuItem
                                        key={key}
                                        onClick={() => handleDateRangeSelect(key)}
                                        className={cn(
                                            activeDateRange === key && key !== "custom" && "text-indigo-600 bg-indigo-50 font-bold dark:bg-indigo-950/40 dark:text-indigo-400",
                                            key === "custom" && "border-t mt-1 pt-2 font-semibold"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>{DATE_RANGE_LABELS[key]}</span>
                                            {key === "custom" && <ChevronRight className="h-3 w-3 opacity-50" />}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Custom Date Modal */}
                        <AnimatePresence>
                            {isCustomDateOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-[60] bg-slate-900/10 backdrop-blur-xs"
                                        onClick={() => setIsCustomDateOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute top-full right-0 mt-3 z-[70] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-2xl overflow-hidden flex min-w-[620px]"
                                    >
                                        <div className="w-44 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 overflow-y-auto max-h-[460px]">
                                            {(Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]).filter(k => k !== 'custom').map((key) => (
                                                <button
                                                    key={key}
                                                    onClick={() => {
                                                        setActiveDateRange(key);
                                                        const range = getDateRange(key);
                                                        if (range.from && range.to) {
                                                            setTempCustomRange({
                                                                from: range.from.toISOString().split('T')[0],
                                                                to: range.to.toISOString().split('T')[0]
                                                            });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all mb-1",
                                                        activeDateRange === key
                                                            ? theme.buttonPrimary
                                                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    {DATE_RANGE_LABELS[key]}
                                                </button>
                                            ))}
                                            <div className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mt-1">
                                                Custom
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col p-5 space-y-5 bg-white dark:bg-slate-900">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <DualDateInput
                                                        label="From Date"
                                                        value={{
                                                            ad: tempCustomRange.from,
                                                            bs: adToBs(tempCustomRange.from)
                                                        }}
                                                        onChange={(next) => setTempCustomRange(prev => ({ ...prev, from: next.ad }))}
                                                        accentColor="bg-indigo-600"
                                                    />
                                                </div>
                                                <div className="pt-7 text-slate-300">
                                                    <ChevronRight className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <DualDateInput
                                                        label="To Date"
                                                        value={{
                                                            ad: tempCustomRange.to,
                                                            bs: adToBs(tempCustomRange.to)
                                                        }}
                                                        onChange={(next) => setTempCustomRange(prev => ({ ...prev, to: next.ad }))}
                                                        accentColor="bg-indigo-600"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Calendar</span>
                                                    <Calendar
                                                        value={tempCustomRange.from}
                                                        onChange={(ad) => setTempCustomRange(prev => ({ ...prev, from: ad }))}
                                                        accentColor="bg-indigo-600"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Calendar</span>
                                                    <Calendar
                                                        value={tempCustomRange.to}
                                                        onChange={(ad) => setTempCustomRange(prev => ({ ...prev, to: ad }))}
                                                        accentColor="bg-indigo-600"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => setIsCustomDateOpen(false)}
                                                    className="px-4 h-8 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 uppercase tracking-wider"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleApplyCustomRange}
                                                    className={cn("px-6 h-8 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95", theme.buttonPrimary)}
                                                >
                                                    Apply Range
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Comparison */}
                {config.dateRange?.allowComparison && (
                    <button
                        type="button"
                        onClick={handleCompareToggle}
                        className={cn(
                            "flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all select-none",
                            compareEnabled
                                ? theme.badgeBg
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-slate-500 hover:border-slate-300"
                        )}
                    >
                        <div className={cn("h-2.5 w-2.5 rounded-full border border-current flex items-center justify-center", compareEnabled ? "bg-indigo-600" : "bg-transparent")} />
                        <span>Compare Prev Year</span>
                    </button>
                )}

                {/* Primary Filters */}
                {primaryFilters.map((filter) => (
                    <div key={filter.key} className="flex items-center gap-1.5 px-3 h-9 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 transition-all">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{filter.label}:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 outline-none max-w-[140px] truncate">
                                    {(() => {
                                        const val = selectedFilters[filter.key];
                                        if (!val || (Array.isArray(val) && val.length === 0)) return "All";
                                        if (Array.isArray(val)) {
                                            if (val.length === 1) {
                                                const opt = filter.options?.find(o => o.value === val[0]);
                                                return opt ? opt.label : val[0];
                                            }
                                            return `${val.length} Selected`;
                                        }
                                        const opt = filter.options?.find(o => o.value === val);
                                        return opt ? opt.label : String(val);
                                    })()}
                                    <ChevronDown className="h-3 w-3 text-slate-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 max-h-[300px] overflow-y-auto">
                                {(filter.options || []).map((opt) => {
                                    const isSelected = Array.isArray(selectedFilters[filter.key])
                                        ? selectedFilters[filter.key]?.includes(opt.value)
                                        : selectedFilters[filter.key] === opt.value;
                                    return (
                                        <DropdownMenuItem
                                            key={opt.value}
                                            onClick={() => handleFilterSelect(filter.key, opt.value)}
                                            className={cn(isSelected && "text-indigo-600 bg-indigo-50 font-bold dark:bg-indigo-950/40 dark:text-indigo-400")}
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center transition-all", isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 dark:border-slate-600")}>
                                                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                                                </div>
                                                <span>{opt.label}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}

                {/* Secondary Filters */}
                {secondaryFilters.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-xl gap-1.5 font-bold text-xs border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-indigo-300"
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
                                More Filters
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 p-3 space-y-3 z-[60]">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b">
                                Additional Criteria
                            </div>
                            {secondaryFilters.map((sf) => (
                                <div key={sf.key} className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                        {sf.label}
                                    </label>
                                    {sf.type === "amount-range" || sf.type === "number-range" ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                placeholder="Min"
                                                type="number"
                                                value={selectedFilters[sf.key]?.min || ""}
                                                onChange={(e) => handleRangeAmountChange(sf.key, "min", e.target.value)}
                                                className="h-8 text-xs rounded-lg"
                                            />
                                            <span className="text-slate-400 text-xs">-</span>
                                            <Input
                                                placeholder="Max"
                                                type="number"
                                                value={selectedFilters[sf.key]?.max || ""}
                                                onChange={(e) => handleRangeAmountChange(sf.key, "max", e.target.value)}
                                                className="h-8 text-xs rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs flex items-center justify-between font-medium">
                                                    <span className="truncate">
                                                        {selectedFilters[sf.key]?.length ? `${selectedFilters[sf.key].length} selected` : "Select..."}
                                                    </span>
                                                    <ChevronDown className="h-3 w-3 text-slate-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-56 max-h-48 overflow-y-auto">
                                                {(sf.options || []).map((o) => (
                                                    <DropdownMenuItem
                                                        key={o.value}
                                                        onClick={() => handleFilterSelect(sf.key, o.value)}
                                                        className="text-xs"
                                                    >
                                                        {o.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Column Visibility */}
                {(config.columns || []).length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-xl gap-1.5 font-bold text-xs border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-indigo-300"
                            >
                                <Settings2 className="h-3.5 w-3.5 text-indigo-500" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 p-2 z-[60]">
                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Table Columns</h4>
                                <p className="text-[10px] text-slate-400">Toggle column visibility</p>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                                {(config.columns || []).map((col) => {
                                    const isVisible = visibleColumns.includes(col.key);
                                    return (
                                        <DropdownMenuItem
                                            key={col.key}
                                            onClick={() => handleToggleColumn(col.key)}
                                            closeOnSelect={false}
                                            className={cn("flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer", col.locked && "opacity-60 cursor-not-allowed")}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isVisible ? <Eye className="h-3.5 w-3.5 text-indigo-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                                                <span className={cn(isVisible && "font-bold text-slate-900 dark:text-slate-100")}>
                                                    {col.label}
                                                </span>
                                            </div>
                                            {col.locked ? (
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Required</span>
                                            ) : (
                                                <div className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center", isVisible ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300")}>
                                                    {isVisible && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                                                </div>
                                            )}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </div>
                            <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">
                                    {visibleColumns.length} of {(config.columns || []).length} Active
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetColumns}
                                    className="h-6 px-2 text-[10px] text-indigo-600 hover:bg-indigo-50 font-bold"
                                >
                                    Reset
                                </Button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Custom Actions Slot */}
                {props.actions ? (
                    <div className="flex items-center gap-2 ml-auto">
                        {props.actions}
                    </div>
                ) : null}
            </div>

            {/* Active Filter Tags */}
            {(activeFilterCount > 0 || activeDateRange === "custom" || searchValue) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Active:</span>

                    {searchValue && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            <span>Search: "{searchValue}"</span>
                            <button onClick={() => handleSearchChange("")} className="hover:text-indigo-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {activeDateRange === "custom" && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            <span>Period: Custom</span>
                            <button onClick={() => handleDateRangeSelect(defaultRangeKey)} className="hover:text-indigo-900">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {Object.entries(selectedFilters).map(([key, val]) => {
                        if (!val) return null;
                        const filterDef = allFilters.find(f => f.key === key);
                        const label = filterDef?.label || key;

                        if (Array.isArray(val)) {
                            return val.map((v) => {
                                const opt = filterDef?.options?.find(o => o.value === v);
                                return (
                                    <div key={key + v} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                        <span>{label}: {opt ? opt.label : v}</span>
                                        <button onClick={() => removeFilterItem(key, v)} className="hover:text-indigo-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            });
                        }

                        if (typeof val === "object" && (val.min || val.max)) {
                            return (
                                <div key={key} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                    <span>{label}: {val.min || "0"} - {val.max || "∞"}</span>
                                    <button onClick={() => removeFilterItem(key)} className="hover:text-indigo-900">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        }

                        const opt = filterDef?.options?.find(o => o.value === val);
                        return (
                            <div key={key} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                <span>{label}: {opt ? opt.label : String(val)}</span>
                                <button onClick={() => removeFilterItem(key)} className="hover:text-indigo-900">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    })}

                    <button
                        onClick={handleClearAll}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 uppercase tracking-wider ml-auto flex items-center gap-1"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
}
