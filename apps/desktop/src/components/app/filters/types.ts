import * as React from "react";
import { DateRangeKey, DateRange } from "@/lib/dates/ranges";

export type FilterType =
    | "select"
    | "multi-select"
    | "number-range"
    | "amount-range"
    | "boolean"
    | "text"
    | "date-range";

export interface FilterOptionItem {
    value: string;
    label: string;
    badge?: string;
    description?: string;
}

export interface FilterOptionDef {
    key: string;
    label: string;
    type?: FilterType;
    options?: FilterOptionItem[];
    multiple?: boolean;
    priority?: "primary" | "secondary";
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    placeholder?: string;
    defaultValue?: any;
}

export interface ColumnOptionDef {
    key: string;
    label: string;
    defaultVisible?: boolean;
    locked?: boolean;
}

export interface DateRangeConfig {
    enabled?: boolean;
    defaultRange?: DateRangeKey;
    allowCustom?: boolean;
    allowComparison?: boolean;
    label?: string;
}

export interface SearchConfig {
    enabled?: boolean;
    placeholder?: string;
    debounceMs?: number;
}

export type ThemeAccentColor =
    | "indigo"
    | "emerald"
    | "orange"
    | "sky"
    | "violet"
    | "rose"
    | "amber"
    | "blue"
    | "slate";

export interface FilterTheme {
    accentColor?: ThemeAccentColor;
    density?: "compact" | "comfortable";
    variant?: "default" | "card" | "flat";
}

export interface FilterBarConfig {
    search?: SearchConfig;
    dateRange?: DateRangeConfig;
    filters?: FilterOptionDef[];
    columns?: ColumnOptionDef[];
    defaultValues?: Record<string, any>;
    theme?: FilterTheme;
}

export interface FilterValueState {
    search?: string;
    dateRange?: DateRange & { key?: DateRangeKey };
    compare?: boolean;
    filters: Record<string, any>;
    visibleColumns?: string[];
}

export interface LegacyFilterOption {
    key: string;
    label: string;
    options: { value: string; label: string }[];
    multiple?: boolean;
    priority?: "primary" | "secondary";
    type?: FilterType;
}

export interface LegacyColumnOption {
    key: string;
    label: string;
    defaultVisible?: boolean;
    locked?: boolean;
}

export interface AdvancedFilterBarProps {
    config?: FilterBarConfig;
    value?: Partial<FilterValueState>;
    onChange?: (state: FilterValueState) => void;
    actions?: React.ReactNode;

    onSearch?: (value: string) => void;
    onFilterChange?: (filters: any) => void;
    filterOptions?: LegacyFilterOption[] | FilterOptionDef[];
    initialSearch?: string;
    searchValue?: string;
    className?: string;
    defaultRange?: DateRangeKey;
    showComparison?: boolean;
    onComparisonChange?: (enabled: boolean) => void;
    columnOptions?: LegacyColumnOption[] | ColumnOptionDef[];
    onVisibleColumnsChange?: (columns: string[]) => void;
}
