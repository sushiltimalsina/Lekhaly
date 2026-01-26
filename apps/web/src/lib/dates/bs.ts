// apps/web/src/lib/dates/bs.ts
import { adToBs, bsToAd } from "./convert";

export type BsDateString = string; // e.g. "2082-05-10"
export type IsoDateString = string; // e.g. "2026-01-22T00:00:00.000Z"

export function isValidBs(bs: string): boolean {
  // Basic format: YYYY-MM-DD (BS year range not strictly validated here)
  return /^\d{4}-\d{2}-\d{2}$/.test(bs);
}

export function isValidIso(iso: string): boolean {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime());
}

/**
 * Convert AD ISO -> BS string
 * Replace implementation with a real converter later.
 */
export function toBs(iso: IsoDateString): BsDateString {
  if (!isValidIso(iso)) return "";
  try {
    return adToBs(iso) as BsDateString;
  } catch {
    return "";
  }
}

/**
 * Convert BS string -> AD ISO
 * Replace implementation with a real converter later.
 */
export function toAd(bs: BsDateString): IsoDateString {
  if (!isValidBs(bs)) return "";
  try {
    return bsToAd(bs);
  } catch {
    return "";
  }
}

export function todayIso(): IsoDateString {
  return new Date().toISOString();
}
