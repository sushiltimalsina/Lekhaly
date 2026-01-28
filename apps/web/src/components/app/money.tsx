"use client";

import * as React from "react";
import { getCurrencySettings, subscribeUi } from "@/lib/store/ui";

export function formatMoney(
  value: number,
  opts?: { currency?: string; decimals?: number; symbol?: string; format?: string }
) {
  const currency = opts?.currency ?? "NPR";
  const decimals = opts?.decimals ?? 2;
  const symbol = opts?.symbol ?? "रु.";
  const format = opts?.format ?? "en-IN";

  if (!Number.isFinite(value)) return "—";

  // Nepal typically uses comma grouping similar to Indian system,
  // but JS Intl "en-IN" gives a good default for NPR formatting.
  const formatted = new Intl.NumberFormat(format, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return currency ? `${symbol} ${formatted}` : formatted;
}

export function MoneyText({
  value,
  className,
  currency,
  decimals,
}: {
  value: number;
  className?: string;
  currency?: string;
  decimals?: number;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [settings, setSettings] = React.useState(getCurrencySettings());

  React.useEffect(() => {
    setMounted(true);
    return subscribeUi((next) => {
      setSettings({
        currencyCode: next.currencyCode,
        currencySymbol: next.currencySymbol,
        numberFormat: next.numberFormat,
      });
    });
  }, []);

  // On server/first-render, use the default settings but don't worry about reactive updates yet
  // Once mounted, it will re-render with client-side settings if they differ.
  const currentSettings = mounted ? settings : getCurrencySettings();

  return (
    <span className={["mono-numbers tabular-nums", className ?? ""].join(" ")}>
      {formatMoney(value, {
        currency,
        decimals,
        symbol: currentSettings.currencySymbol,
        format: currentSettings.numberFormat,
      })}
    </span>
  );
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: {
  value: number | "";
  onChange: (val: number | "") => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [raw, setRaw] = React.useState<string>(value === "" ? "" : String(value));

  React.useEffect(() => {
    setRaw(value === "" ? "" : String(value));
  }, [value]);

  return (
    <input
      disabled={disabled}
      value={raw}
      inputMode="decimal"
      placeholder={placeholder ?? "0.00"}
      onChange={(e) => {
        const next = e.target.value;
        setRaw(next);

        if (next.trim() === "") return onChange("");
        const n = Number(next);
        if (Number.isFinite(n)) onChange(n);
      }}
      className={[
        "w-full rounded-xl border bg-background px-3 py-2 text-right text-sm outline-none",
        "focus:ring-2 focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className ?? "",
      ].join(" ")}
    />
  );
}
