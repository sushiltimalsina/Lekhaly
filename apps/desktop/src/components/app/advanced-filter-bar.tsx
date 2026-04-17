"use client";

import * as React from "react";
import {
    Calendar as CalendarIcon,
    ChevronDown,
    Filter,
    Search,
    X,
    Plus,
    Play,
    ChevronLeft,
    ChevronRight,
    Settings2,
    Eye,
    EyeOff,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@lekhaly/ui";
import { Input } from "@lekhaly/ui";
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

export interface FilterOption {
    key: string;
    label: string;
    options: { value: string; label: string }[];
    multiple?: boolean;
}

export interface ColumnOption {
    key: string;
    label: string;
    defaultVisible?: boolean;
}

interface AdvancedFilterBarProps {
    onSearch?: (value: string) => void;
    onFilterChange?: (filters: any) => void;
    filterOptions?: FilterOption[];
    initialSearch?: string;
    searchValue?: string;
    className?: string;
    defaultRange?: DateRangeKey;
    showComparison?: boolean;
    onComparisonChange?: (enabled: boolean) => void;
    columnOptions?: ColumnOption[];
    onVisibleColumnsChange?: (columns: string[]) => void;
}

export default function AdvancedFilterBar({
    onSearch,
    onFilterChange,
    filterOptions = [],
    searchValue: externalSearchValue,
    className,
    defaultRange = "this_year",
    showComparison,
    onComparisonChange,
    columnOptions = [],
    onVisibleColumnsChange
}: AdvancedFilterBarProps) {
    const { dateFormat } = useDateFormat();
    const [internalSearch, setInternalSearch] = React.useState("");
    const [activeDateRange, setActiveDateRange] = React.useState<DateRangeKey>(defaultRange);
    const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({});
    const [isCustomDateOpen, setIsCustomDateOpen] = React.useState(false);
    const [compareEnabled, setCompareEnabled] = React.useState(false);
    const [visibleColumns, setVisibleColumns] = React.useState<string[]>(
        columnOptions.filter(c => c.defaultVisible !== false).map(c => c.key)
    );

    // Custom range state
    const [tempCustomRange, setTempCustomRange] = React.useState<{ from: string, to: string }>({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    // Initial load effect to send the default range to the parent
    React.useEffect(() => {
        const range = getDateRange(defaultRange, dateFormat);
        onFilterChange?.({ ...selectedFilters, dateRange: range, compare: compareEnabled });
    }, []);

    const searchValue = externalSearchValue !== undefined ? externalSearchValue : internalSearch;

    const handleDateRangeSelect = (key: DateRangeKey) => {
        if (key === "custom") {
            setIsCustomDateOpen(true);
            return;
        }

        setActiveDateRange(key);
        const range = getDateRange(key, dateFormat);
        onFilterChange?.({ ...selectedFilters, dateRange: range, compare: compareEnabled });
    };

    const handleCompareToggle = () => {
        const next = !compareEnabled;
        setCompareEnabled(next);
        onComparisonChange?.(next);
        const range = getDateRange(activeDateRange, dateFormat);
        onFilterChange?.({ ...selectedFilters, dateRange: range, compare: next });
    };

    const handleApplyCustomRange = () => {
        setActiveDateRange("custom");
        const range = {
            from: new Date(tempCustomRange.from),
            to: new Date(tempCustomRange.to)
        };
        onFilterChange?.({ ...selectedFilters, dateRange: range });
        setIsCustomDateOpen(false);
    };

    const handleFilterSelect = (key: string, value: string) => {
        const current = selectedFilters[key] || [];
        const filterDef = filterOptions.find(f => f.key === key);
        const isSingleSelect = filterDef?.multiple === false;

        let updated;
        if (isSingleSelect) {
            // If already selected, clear it. If not, replace with new value.
            updated = current.includes(value) ? [] : [value];
        } else {
            updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
        }

        const newFilters = { ...selectedFilters, [key]: updated };
        setSelectedFilters(newFilters);
        onFilterChange?.({ ...newFilters, dateRange: getDateRange(activeDateRange, dateFormat), compare: compareEnabled });
    };

    const toggleColumn = (key: string) => {
        const next = visibleColumns.includes(key)
            ? visibleColumns.filter(c => c !== key)
            : [...visibleColumns, key];
        setVisibleColumns(next);
        onVisibleColumnsChange?.(next);
    };

    const removeFilter = (key: string, value: string) => {
        const current = selectedFilters[key] || [];
        const updated = current.filter(v => v !== value);
        const newFilters = { ...selectedFilters, [key]: updated };
        setSelectedFilters(newFilters);
        onFilterChange?.({ ...newFilters, dateRange: getDateRange(activeDateRange, dateFormat), compare: compareEnabled });
    };

    return (
        <div className={cn("flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm", className)}>
            <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[300px] group">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => {
                            setInternalSearch(e.target.value);
                            onSearch?.(e.target.value);
                        }}
                        className="pl-10 h-10 rounded-2xl bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:border-indigo-500 transition-all dark:bg-slate-800/30 dark:border-slate-800 dark:focus:border-indigo-400"
                    />
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest px-2">
                    <Filter className="h-4 w-4" />
                    Filters:
                </div>

                {/* Date Range Dropdown with Custom Section */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 transition-all relative">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Date Range:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-colors outline-none">
                                {activeDateRange === "custom" ? "Custom Range" : DATE_RANGE_LABELS[activeDateRange]}
                                <ChevronDown className="h-3 w-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
                            {(Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]).map((key) => (
                                <DropdownMenuItem
                                    key={key}
                                    onClick={() => handleDateRangeSelect(key)}
                                    className={cn(
                                        activeDateRange === key && key !== "custom" && "text-indigo-600 bg-indigo-50 font-bold",
                                        key === "custom" && "border-t mt-1 pt-2"
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

                    {/* Custom Date Range Panel (Expanded View Like Zoho) */}
                    <AnimatePresence>
                        {isCustomDateOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-[60]"
                                    onClick={() => setIsCustomDateOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute top-full right-0 mt-4 z-[70] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-2xl overflow-hidden flex min-w-[640px]"
                                >
                                    {/* Sidebar Presets */}
                                    <div className="w-48 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 overflow-y-auto max-h-[480px]">
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
                                                    "w-full text-left px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all mb-1",
                                                    activeDateRange === key
                                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                {DATE_RANGE_LABELS[key]}
                                            </button>
                                        ))}
                                        <div className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 mt-2">
                                            Custom
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 flex flex-col p-6 space-y-6 bg-white dark:bg-slate-900">
                                        {/* Date Inputs */}
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
                                            <div className="pt-8 text-slate-300">
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

                                        {/* Premium Calendar Grid Selection */}
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Select Start Period</span>
                                                <Calendar
                                                    value={tempCustomRange.from}
                                                    onChange={(ad) => setTempCustomRange(prev => ({ ...prev, from: ad }))}
                                                    accentColor="bg-indigo-600"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Select End Period</span>
                                                <Calendar
                                                    value={tempCustomRange.to}
                                                    onChange={(ad) => setTempCustomRange(prev => ({ ...prev, to: ad }))}
                                                    accentColor="bg-indigo-600"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <button
                                                onClick={() => setIsCustomDateOpen(false)}
                                                className="px-6 h-10 text-xs font-black text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleApplyCustomRange}
                                                className="px-8 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {showComparison && (
                    <div
                        onClick={handleCompareToggle}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-2xl border cursor-pointer transition-all active:scale-95 select-none",
                            compareEnabled
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-200"
                        )}
                    >
                        <div className={cn(
                            "h-3 w-3 rounded-full border border-current flex items-center justify-center transition-all",
                            compareEnabled ? "bg-white" : "bg-transparent"
                        )}>
                            {compareEnabled && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            compareEnabled ? "text-white" : "text-slate-400"
                        )}>
                            Compare with Previous Year
                        </span>
                    </div>
                )}

                {/* Dynamic Filters */}
                {filterOptions.map((filter) => (
                    <div key={filter.key} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 transition-all">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">{filter.label}:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-colors outline-none max-w-[150px] truncate">
                                    {(() => {
                                        const selection = selectedFilters[filter.key];
                                        if (!selection || selection.length === 0) return "All";
                                        // If 'all' is explicitly selected in the list
                                        if (selection.includes('all')) return "All";

                                        // If single select is enforced or only 1 item selected
                                        if (selection.length === 1) {
                                            const option = filter.options.find(o => o.value === selection[0]);
                                            return option ? option.label : selection[0];
                                        }

                                        return `${selection.length} Selected`;
                                    })()}
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                                {filter.options.map((opt) => (
                                    <DropdownMenuItem
                                        key={opt.value}
                                        onClick={() => handleFilterSelect(filter.key, opt.value)}
                                        className={cn(selectedFilters[filter.key]?.includes(opt.value) && "text-indigo-600 bg-indigo-50 font-bold")}
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className={cn(
                                                "h-3 w-3 rounded-sm border transition-all",
                                                selectedFilters[filter.key]?.includes(opt.value) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                                            )}>
                                                {selectedFilters[filter.key]?.includes(opt.value) && <Plus className="h-2 w-2 text-white" />}
                                            </div>
                                            {opt.label}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}

                {/* Registry Actions Group */}
                <div className="flex items-center gap-2 ml-auto pt-1 sm:pt-0">

                    {columnOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 px-5 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 hover:bg-indigo-50/30 dark:hover:border-indigo-900/50 transition-all active:scale-95 shadow-sm shadow-slate-200/50 dark:shadow-none"
                                >
                                    <Settings2 className="h-4 w-4 text-indigo-500" />
                                    More Filters
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-72 rounded-[28px] p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-none z-[100]"
                                align="start"
                                sideOffset={12}
                            >
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 mb-2">
                                    <h3 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.15em]">Registry Display</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Configure Table Columns</p>
                                </div>

                                <div className="max-h-[350px] overflow-y-auto px-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                    {columnOptions.map((col) => {
                                        const isVisible = visibleColumns.includes(col.key);
                                        return (
                                            <DropdownMenuItem
                                                key={col.key}
                                                onClick={() => toggleColumn(col.key)}
                                                closeOnSelect={false}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group outline-none",
                                                    isVisible
                                                        ? "bg-indigo-50/50 dark:bg-indigo-900/10 border border-transparent"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
                                                        isVisible
                                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                                                    )}>
                                                        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                                                            isVisible ? "text-slate-900 dark:text-white" : "text-slate-500"
                                                        )}>
                                                            {col.label}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                                            {isVisible ? "Visible in registry" : "Hidden from view"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
                                                    isVisible
                                                        ? "border-indigo-600 bg-indigo-600"
                                                        : "border-slate-200 dark:border-slate-800 bg-transparent"
                                                )}>
                                                    {isVisible && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                                                </div>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </div>

                                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-2">
                                        {visibleColumns.length} of {columnOptions.length} Active
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const defaultKeys = columnOptions.filter(c => c.defaultVisible).map(c => c.key);
                                            setVisibleColumns(defaultKeys);
                                            onVisibleColumnsChange?.(defaultKeys);
                                        }}
                                        className="h-6 px-3 text-[9px] font-black text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 uppercase tracking-widest"
                                    >
                                        Reset to Default
                                    </Button>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <Button className="h-10 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 transition-all active:scale-95 group relative overflow-hidden ring-offset-white dark:ring-offset-slate-950">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        <Play className="h-4 w-4 fill-current" />
                        Run Report
                    </Button>
                </div>
            </div>

            {/* Selected Filters Tags */}
            {(Object.entries(selectedFilters).some(([_, vals]) => vals.length > 0) || activeDateRange === 'custom') && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Filters:</span>

                    {activeDateRange === 'custom' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">
                                Period: {tempCustomRange.from} to {tempCustomRange.to}
                            </span>
                            <button onClick={() => handleDateRangeSelect('this_month')} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {Object.entries(selectedFilters).map(([key, vals]) => (
                        vals.map(val => {
                            const filterDef = filterOptions.find(f => f.key === key);
                            const optDef = filterDef?.options.find(o => o.value === val);
                            return (
                                <div key={key + val} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50">
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">
                                        {filterDef?.label}: {optDef?.label || val}
                                    </span>
                                    <button onClick={() => removeFilter(key, val)} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })
                    ))}
                    <button
                        onClick={() => {
                            setSelectedFilters({});
                            // Reset to default range but ensure filters are cleared in the callback
                            const defaultKey = 'this_month';
                            setActiveDateRange(defaultKey);
                            const range = getDateRange(defaultKey, dateFormat);
                            onFilterChange?.({ dateRange: range, compare: compareEnabled });
                        }}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest ml-auto"
                    >
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
}

function CalendarPreview({ date, label }: { date: Date, label: string }) {
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
    const firstDay = new Date(year, date.getMonth(), 1).getDay();
    const today = date.getDate();

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{label}</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{monthName} {year}</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-[8px] font-black text-slate-300 py-1">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "text-[9px] font-bold h-6 flex items-center justify-center rounded-lg transition-colors",
                            (i + 1) === today
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                : "text-slate-500 dark:text-slate-400"
                        )}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>
        </div>
    );
}

