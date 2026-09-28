import { BadRequestException } from "@nestjs/common";
import NepaliDate from "nepali-date-converter";

const BS_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function bsToAdDate(bs: string): Date {
  parseBsDate(bs);
  const ad = new NepaliDate(bs).getAD();
  return new Date(Date.UTC(ad.year, ad.month, ad.date));
}

export function adToBsDate(ad: Date): string {
  const nepali = new NepaliDate(ad);
  return nepali.format("YYYY-MM-DD");
}

export function parseBsDate(bs: string) {
  const match = BS_REGEX.exec(bs);
  if (!match) {
    throw new BadRequestException("Invalid BS date format. Use YYYY-MM-DD.");
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function getCurrentBsDate(): string {
  return adToBsDate(new Date());
}

function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

export function bsFiscalYearRange(currentBs: string, fiscalYearStartMonth: number) {
  const { year, month } = parseBsDate(currentBs);
  const startYear = month >= fiscalYearStartMonth ? year : year - 1;
  const startBs = `${startYear}-${pad2(fiscalYearStartMonth)}-01`;
  const nextStartBs = `${startYear + 1}-${pad2(fiscalYearStartMonth)}-01`;
  const startAd = bsToAdDate(startBs);
  const nextStartAd = bsToAdDate(nextStartBs);
  const endAd = new Date(nextStartAd.getTime() - 24 * 60 * 60 * 1000);
  const endBs = adToBsDate(endAd);
  return { from: startAd, to: endAd, fromBs: startBs, toBs: endBs };
}

export function bsFiscalYearRangeFromStart(startBs: string) {
  const { year, month, day } = parseBsDate(startBs);
  const startDate = bsToAdDate(startBs);
  if (adToBsDate(startDate) !== startBs) {
    throw new BadRequestException("Invalid BS fiscal-year start date.");
  }

  let nextStartDate: Date | null = null;
  for (let nextDay = day; nextDay >= 1; nextDay -= 1) {
    const nextStartBs = `${year + 1}-${pad2(month)}-${pad2(nextDay)}`;
    try {
      const candidate = bsToAdDate(nextStartBs);
      if (adToBsDate(candidate) === nextStartBs) {
        nextStartDate = candidate;
        break;
      }
    } catch {
      continue;
    }
  }
  if (!nextStartDate) throw new BadRequestException("Unable to calculate fiscal-year end date.");

  const endDate = new Date(nextStartDate.getTime() - 24 * 60 * 60 * 1000);
  return { startDate, endDate, endDateBs: adToBsDate(endDate) };
}

export function resolveAdDate(input?: Date, bs?: string): { date: Date; bs?: string } {
  if (input) return { date: input, bs };
  if (bs) return { date: bsToAdDate(bs), bs };
  throw new BadRequestException("Date is required");
}
