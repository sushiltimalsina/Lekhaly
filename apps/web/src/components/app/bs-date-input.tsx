"use client";

import * as React from "react";
import { toAd, toBs, isValidBs, isValidIso } from "@/lib/dates/bs";

type BsDateInputProps = {
  valueBs?: string;
  valueAd?: string;
  onChange: (next: { bs: string; ad: string }) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
};

export default function BsDateInput({
  valueBs,
  valueAd,
  onChange,
  label,
  disabled,
  required,
}: BsDateInputProps) {
  const [bs, setBs] = React.useState(valueBs ?? "");
  const [ad, setAd] = React.useState(valueAd ?? "");
  const [mode, setMode] = React.useState<"bs" | "ad">("bs");

  React.useEffect(() => {
    if (valueBs !== undefined) setBs(valueBs);
  }, [valueBs]);

  React.useEffect(() => {
    if (valueAd !== undefined) setAd(valueAd);
  }, [valueAd]);

  function handleBsChange(v: string) {
    setBs(v);
    if (isValidBs(v)) {
      const nextAd = toAd(v);
      setAd(nextAd);
      onChange({ bs: v, ad: nextAd });
    }
  }

  function handleAdChange(v: string) {
    setAd(v);
    if (isValidIso(v)) {
      const nextBs = toBs(v);
      setBs(nextBs);
      onChange({ bs: nextBs, ad: v });
    }
  }

  return (
    <div className="space-y-1">
      {label ? (
        <label className="text-xs text-muted-foreground">
          {label} {required ? <span className="text-red-600">*</span> : null}
        </label>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          disabled={disabled}
          value={mode === "bs" ? bs : ad}
          placeholder={mode === "bs" ? "2082-05-10" : "2026-01-22"}
          onChange={(e) =>
            mode === "bs" ? handleBsChange(e.target.value) : handleAdChange(e.target.value)
          }
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => setMode(mode === "bs" ? "ad" : "bs")}
          className="rounded-xl border bg-background px-3 py-2 text-xs hover:bg-muted"
          title="Toggle BS / AD"
        >
          {mode === "bs" ? "BS" : "AD"}
        </button>
      </div>

      {/* Secondary date preview */}
      <div className="text-xs text-muted-foreground">
        {mode === "bs" ? (
          ad ? `AD: ${ad.slice(0, 10)}` : "AD: —"
        ) : bs ? (
          `BS: ${bs}`
        ) : (
          "BS: —"
        )}
      </div>
    </div>
  );
}
