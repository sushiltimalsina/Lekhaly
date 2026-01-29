
export type DateRangeKey =
    | "today"
    | "this_week"
    | "this_month"
    | "this_quarter"
    | "this_year"
    | "yesterday"
    | "previous_week"
    | "previous_month"
    | "previous_quarter"
    | "previous_year"
    | "custom";

export interface DateRange {
    from: Date | null;
    to: Date | null;
}

export function getDateRange(key: DateRangeKey): DateRange {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (key) {
        case "today": {
            const from = new Date(today);
            const to = new Date(today);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "this_week": {
            const from = new Date(today);
            from.setDate(today.getDate() - today.getDay()); // Sunday
            const to = new Date(from);
            to.setDate(from.getDate() + 6);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "this_month": {
            const from = new Date(today.getFullYear(), today.getMonth(), 1);
            const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "this_quarter": {
            const quarter = Math.floor(today.getMonth() / 3);
            const from = new Date(today.getFullYear(), quarter * 3, 1);
            const to = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "this_year": {
            const from = new Date(today.getFullYear(), 0, 1);
            const to = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
            return { from, to };
        }
        case "yesterday": {
            const from = new Date(today);
            from.setDate(today.getDate() - 1);
            const to = new Date(from);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "previous_week": {
            const from = new Date(today);
            from.setDate(today.getDate() - today.getDay() - 7);
            const to = new Date(from);
            to.setDate(from.getDate() + 6);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "previous_month": {
            const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const to = new Date(today.getFullYear(), today.getMonth(), 0);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "previous_quarter": {
            const quarter = Math.floor(today.getMonth() / 3) - 1;
            const from = new Date(today.getFullYear(), quarter * 3, 1);
            const to = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "previous_year": {
            const from = new Date(today.getFullYear() - 1, 0, 1);
            const to = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            return { from, to };
        }
        case "custom":
        default:
            return { from: null, to: null };
    }
}

export const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
    today: "Today",
    this_week: "This Week",
    this_month: "This Month",
    this_quarter: "This Quarter",
    this_year: "This Year",
    yesterday: "Yesterday",
    previous_week: "Previous Week",
    previous_month: "Previous Month",
    previous_quarter: "Previous Quarter",
    previous_year: "Previous Year",
    custom: "Custom",
};
