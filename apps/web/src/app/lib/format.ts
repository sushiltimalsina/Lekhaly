// apps/web/src/lib/format.ts
import { toBs, isValidIso } from "@/lib/dates/bs";

export function safeText(v: unknown, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
}

export function formatMoney(value: unknown, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatIsoDate(iso: string) {
  if (!iso || !isValidIso(iso)) return "—";
  return iso.slice(0, 10);
}

/**
 * Show BS as primary, AD as secondary.
 */
export function formatDateBsPrimary(iso?: string, bs?: string) {
  const bsVal = bs && bs.trim().length ? bs : iso ? toBs(iso) : "";
  const adVal = iso ? formatIsoDate(iso) : "";

  return {
    bs: bsVal || "—",
    ad: adVal || "",
  };
}
