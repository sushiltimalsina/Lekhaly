"use client";

export function formatCurrency(value: number) {
    const formatted = new Intl.NumberFormat("ne-NP", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
    return `रु ${formatted}`;
}
