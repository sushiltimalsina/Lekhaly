
export type DateRangeKey =
    | "today"
    | "current_month"
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

import NepaliDate from "nepali-date-converter";

const DEFAULT_FISCAL_YEAR_START_MONTH = 4;

function getFiscalYearBounds(date: Date, fiscalYearStartMonth = DEFAULT_FISCAL_YEAR_START_MONTH) {
    const monthIndex = fiscalYearStartMonth - 1;
    const currentYear = date.getFullYear();
    const effectiveYear = date.getMonth() >= monthIndex ? currentYear : currentYear - 1;
    const from = new Date(effectiveYear, monthIndex, 1, 0, 0, 0, 0);
    const to = new Date(effectiveYear + 1, monthIndex, 0, 23, 59, 59, 999);
    return { from, to };
}

export const DATE_RANGE_ORDER: DateRangeKey[] = [
    "today",
    "this_week",
    "this_month",
    "this_year",
    "previous_year",
    "custom",
];

export function getDateRange(key: DateRangeKey, calendar: "ad" | "bs" = "ad"): DateRange {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (calendar === "bs") {
        const nd = new NepaliDate(now);
        const { year, month, date } = nd.getBS();

        const toJSDate = (ndObj: NepaliDate) => {
            const ad = ndObj.getAD();
            return new Date(ad.year, ad.month, ad.date);
        };

        switch (key) {
            case "today": {
                const start = toJSDate(new NepaliDate(year, month, date));
                const end = new Date(start);
                end.setHours(23, 59, 59, 999);
                return { from: start, to: end };
            }
            case "this_month": {
                const start = toJSDate(new NepaliDate(year, month, 1));
                const nextMonth = month === 11 ? 0 : month + 1;
                const nextYear = month === 11 ? year + 1 : year;
                const end = toJSDate(new NepaliDate(nextYear, nextMonth, 1));
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                return { from: start, to: end };
            }
            case "current_month": {
                const start = toJSDate(new NepaliDate(year, month, 1));
                const nextMonth = month === 11 ? 0 : month + 1;
                const nextYear = month === 11 ? year + 1 : year;
                const end = toJSDate(new NepaliDate(nextYear, nextMonth, 1));
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                return { from: start, to: end };
            }
            case "this_quarter": {
                const quarter = Math.floor(month / 3);
                const startMonth = quarter * 3;
                const endMonth = (quarter + 1) * 3;
                const start = toJSDate(new NepaliDate(year, startMonth, 1));
                const nextQStart = toJSDate(new NepaliDate(year, endMonth, 1));
                nextQStart.setDate(nextQStart.getDate() - 1);
                nextQStart.setHours(23, 59, 59, 999);
                return { from: start, to: nextQStart };
            }
            case "this_year": {
                const { from, to } = getFiscalYearBounds(now, DEFAULT_FISCAL_YEAR_START_MONTH);
                return { from, to };
            }
            case "previous_year": {
                const thisYear = getFiscalYearBounds(now, DEFAULT_FISCAL_YEAR_START_MONTH);
                const from = new Date(thisYear.from);
                from.setFullYear(from.getFullYear() - 1);
                const to = new Date(thisYear.to);
                to.setFullYear(to.getFullYear() - 1);
                return { from, to };
            }
            case "yesterday": {
                const prev = new Date(today);
                prev.setDate(today.getDate() - 1);
                const from = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate());
                const to = new Date(from);
                to.setHours(23, 59, 59, 999);
                return { from, to };
            }
            default:
                break;
        }
    }

    switch (key) {
        case "today": {
            const from = new Date(today);
            const to = new Date(today);
            to.setHours(23, 59, 59, 999);
            return { from, to };
        }
        case "this_week": {
            const from = new Date(today);
            from.setDate(today.getDate() - today.getDay());
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
        case "current_month": {
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
            const { from, to } = getFiscalYearBounds(today, DEFAULT_FISCAL_YEAR_START_MONTH);
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
            const thisYear = getFiscalYearBounds(today, DEFAULT_FISCAL_YEAR_START_MONTH);
            const from = new Date(thisYear.from);
            from.setFullYear(from.getFullYear() - 1);
            const to = new Date(thisYear.to);
            to.setFullYear(to.getFullYear() - 1);
            return { from, to };
        }
        case "custom":
        default:
            return { from: null, to: null };
    }
}

export const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
    today: "Today",
    current_month: "Current Month",
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
