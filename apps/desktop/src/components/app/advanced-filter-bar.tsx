// apps/desktop/src/components/app/advanced-filter-bar.tsx
import * as React from "react";
import {
    ChevronDown,
    Filter,
    Search,
    X,
    ChevronRight,
    Settings2,
    Eye,
    EyeOff,
    Check,
    Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DualDateInput } from "@/components/app/dual-date-input";
import { adToBs } from "@/lib/dates/convert";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    searchValue?: string;
    className?: string;
    defaultRange?: DateRangeKey;
    columnOptions?: ColumnOption[];
    onVisibleColumnsChange?: (columns: string[]) => void;
}

export default function AdvancedFilterBar({
    onSearch,
    onFilterChange,
    filterOptions = [],
    searchValue: externalSearchValue,
    className,
    defaultRange = "this_month",
    columnOptions = [],
    onVisibleColumnsChange
}: AdvancedFilterBarProps) {
    const { dateFormat } = useDateFormat();
    const [internalSearch, setInternalSearch] = React.useState("");
    const [activeDateRange, setActiveDateRange] = React.useState<DateRangeKey>(defaultRange);
    const [selectedFilters, setSelectedFilters] = React.useState<Record<string, string[]>>({});
    const [isCustomDateOpen, setIsCustomDateOpen] = React.useState(false);
    const [visibleColumns, setVisibleColumns] = React.useState<string[]>(
        columnOptions.filter(c => c.defaultVisible !== false).map(c => c.key)
    );

    const [tempCustomRange, setTempCustomRange] = React.useState<{ from: string, to: string }>({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const searchValue = externalSearchValue !== undefined ? externalSearchValue : internalSearch;

    const handleDateRangeSelect = (key: DateRangeKey) => {
        if (key === "custom") {
            setIsCustomDateOpen(true);
            return;
        }

        setActiveDateRange(key);
        const range = getDateRange(key, dateFormat);
        onFilterChange?.({ ...selectedFilters, dateRange: range });
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
            updated = current.includes(value) ? [] : [value];
        } else {
            updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
        }

        const newFilters = { ...selectedFilters, [key]: updated };
        setSelectedFilters(newFilters);
        onFilterChange?.({ ...newFilters, dateRange: getDateRange(activeDateRange, dateFormat) });
    };

    const toggleColumn = (key: string) => {
        const next = visibleColumns.includes(key)
            ? visibleColumns.filter(c => c !== key)
            : [...visibleColumns, key];
        setVisibleColumns(next);
        onVisibleColumnsChange?.(next);
    };

    return (
        <div className={cn("flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm", className)}>
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[250px] group">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => {
                            setInternalSearch(e.target.value);
                            onSearch?.(e.target.value);
                        }}
                        className="pl-10 h-10 rounded-2xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Period:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest hover:text-primary transition-colors outline-none">
                                {activeDateRange === "custom" ? "Custom" : DATE_RANGE_LABELS[activeDateRange]}
                                <ChevronDown className="h-3 w-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 overflow-hidden">
                            {(Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]).map((key) => (
                                <DropdownMenuItem
                                    key={key}
                                    onClick={() => handleDateRangeSelect(key)}
                                    className={cn(activeDateRange === key && key !== "custom" && "text-primary bg-primary/5")}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>{DATE_RANGE_LABELS[key]}</span>
                                        {key === "custom" && <ChevronRight className="h-3 w-3 opacity-50" />}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {filterOptions.map((filter) => (
                    <div key={filter.key} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">{filter.label}:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest hover:text-primary transition-colors outline-none">
                                    {selectedFilters[filter.key]?.length ? `${selectedFilters[filter.key].length} selected` : "All"}
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                                {filter.options.map((opt) => (
                                    <DropdownMenuItem
                                        key={opt.value}
                                        onClick={() => handleFilterSelect(filter.key, opt.value)}
                                        closeOnSelect={false}
                                        className={cn(selectedFilters[filter.key]?.includes(opt.value) && "text-primary bg-primary/5")}
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className={cn(
                                                "h-3 w-3 rounded-sm border transition-all",
                                                selectedFilters[filter.key]?.includes(opt.value) ? "bg-primary border-primary" : "border-slate-300"
                                            )}>
                                                {selectedFilters[filter.key]?.includes(opt.value) && <Check className="h-2 w-2 text-white" />}
                                            </div>
                                            {opt.label}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}

                <div className="flex items-center gap-2 ml-auto">
                    {columnOptions.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 px-5 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 bg-white"
                                >
                                    <Settings2 className="h-4 w-4 text-primary" />
                                    Configure
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 p-2 rounded-[24px]">
                                {columnOptions.map((col) => {
                                    const isVisible = visibleColumns.includes(col.key);
                                    return (
                                        <DropdownMenuItem
                                            key={col.key}
                                            onClick={() => toggleColumn(col.key)}
                                            closeOnSelect={false}
                                            className="px-3 py-2.5 rounded-xl flex items-center gap-3"
                                        >
                                            <div className={cn(
                                                "h-6 w-6 rounded flex items-center justify-center transition-all",
                                                isVisible ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                            )}>
                                                {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{col.label}</span>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <Button className="h-10 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
                        <Play className="h-4 w-4 fill-current" />
                        Run Report
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {isCustomDateOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-[20px] border border-slate-100 dark:border-slate-800 border-dashed">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Custom Date Range Audit</h4>
                                <button onClick={() => setIsCustomDateOpen(false)}>
                                    <X className="h-4 w-4 text-slate-400 hover:text-rose-500" />
                                </button>
                            </div>
                            <div className="flex flex-wrap items-end gap-6">
                                <DualDateInput
                                    label="Start Date"
                                    value={{ ad: tempCustomRange.from, bs: adToBs(tempCustomRange.from) }}
                                    onChange={(next) => setTempCustomRange(prev => ({ ...prev, from: next.ad }))}
                                    className="min-w-[240px]"
                                />
                                <DualDateInput
                                    label="End Date"
                                    value={{ ad: tempCustomRange.to, bs: adToBs(tempCustomRange.to) }}
                                    onChange={(next) => setTempCustomRange(prev => ({ ...prev, to: next.ad }))}
                                    className="min-w-[240px]"
                                />
                                <Button
                                    onClick={handleApplyCustomRange}
                                    className="h-10 rounded-xl px-10 bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 mb-[22px]"
                                >
                                    Apply Audit Range
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
