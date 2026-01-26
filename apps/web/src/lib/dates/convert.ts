import NepaliDate from "nepali-date-converter";

const DATE_RE = /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/;

function pad2(n: number | string) {
  return String(n).padStart(2, "0");
}

function normalizeMonth(month: number) {
  if (Number.isFinite(month) && month >= 0 && month <= 11) return month + 1;
  return month;
}

function normalizeAd(input: string) {
  const raw = input.trim().slice(0, 10).replace(/\//g, "-").replace(/\./g, "-");
  if (!DATE_RE.test(raw)) return "";
  const parts = raw.split("-");
  if (parts.length !== 3) return "";
  const [a, b, c] = parts;
  // If first part is year (yyyy-mm-dd)
  if (a.length === 4) {
    return `${a}-${pad2(b)}-${pad2(c)}`;
  }
  // If last part is year (dd-mm-yyyy)
  if (c.length === 4) {
    return `${c}-${pad2(b)}-${pad2(a)}`;
  }
  return "";
}

function normalizeBs(input: string) {
  const raw = input.trim().slice(0, 10).replace(/\//g, "-").replace(/\./g, "-");
  if (!DATE_RE.test(raw)) return "";
  const parts = raw.split("-");
  if (parts.length !== 3) return "";
  const [a, b, c] = parts;
  if (a.length === 4) {
    return `${a}-${pad2(b)}-${pad2(c)}`;
  }
  if (c.length === 4) {
    return `${c}-${pad2(b)}-${pad2(a)}`;
  }
  return "";
}

export function adToBs(adIso: string): string {
  const normalized = normalizeAd(adIso || "");
  if (!normalized) {
    throw new Error("Invalid AD date format");
  }
  const ad = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(ad.getTime())) {
    throw new Error("Invalid AD date value");
  }
  const bs = NepaliDate.fromAD(ad).getBS();
  return `${bs.year}-${pad2(normalizeMonth(bs.month))}-${pad2(bs.date)}`;
}

export function bsToAd(bs: string): string {
  const normalized = normalizeBs(bs || "");
  if (!normalized) {
    throw new Error("Invalid BS date format");
  }
  const ad = new NepaliDate(normalized).getAD();
  return `${ad.year}-${pad2(normalizeMonth(ad.month))}-${pad2(ad.date)}`;
}
