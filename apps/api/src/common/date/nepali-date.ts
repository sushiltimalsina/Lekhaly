import { BadRequestException } from "@nestjs/common";
import NepaliDate from "nepali-date-converter";

const BS_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function bsToAdDate(bs: string): Date {
  const match = BS_REGEX.exec(bs);
  if (!match) {
    throw new BadRequestException("Invalid BS date format. Use YYYY-MM-DD.");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const nepali = new NepaliDate(year, month, day);
  return nepali.toJsDate();
}

export function adToBsDate(ad: Date): string {
  const nepali = new NepaliDate(ad);
  return nepali.format("YYYY-MM-DD");
}

export function resolveAdDate(input?: Date, bs?: string): { date: Date; bs?: string } {
  if (input) return { date: input, bs };
  if (bs) return { date: bsToAdDate(bs), bs };
  throw new BadRequestException("Date is required");
}
