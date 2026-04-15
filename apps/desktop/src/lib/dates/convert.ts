// apps/desktop/src/lib/dates/convert.ts
import NepaliDate from "nepali-date-converter";

export function adToBs(ad: Date | string | number): string {
  try {
    const date = new Date(ad);
    const nepaliDate = new NepaliDate(date);
    return nepaliDate.format("YYYY-MM-DD");
  } catch (e) {
    return "";
  }
}

export function bsToAd(bs: string): Date {
  try {
    const nepaliDate = new NepaliDate(bs);
    return nepaliDate.toJsDate();
  } catch (e) {
    return new Date();
  }
}
