// apps/web/src/lib/dates/bs.ts

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
  // TODO: Replace with nepali date conversion lib
  // Temporary: show ISO date part as fallback, clearly not BS
  return iso.slice(0, 10) as BsDateString;
}

/**
 * Convert BS string -> AD ISO
 * Replace implementation with a real converter later.
 */
export function toAd(bs: BsDateString): IsoDateString {
  if (!isValidBs(bs)) return "";
  // TODO: Replace with nepali date conversion lib
  // Temporary fallback: treat bs as yyyy-mm-dd and convert to ISO in UTC
  const d = new Date(bs + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function todayIso(): IsoDateString {
  return new Date().toISOString();
}
