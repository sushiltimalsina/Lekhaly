// apps/web/src/lib/dates/display.ts
import { isValidBs, isValidIso, toAd, toBs } from "./bs";
import { adToBs, bsToAd } from "./convert";
import type { DateFormat } from "@/lib/date-format";

type DateInput = {
  ad?: string;
  bs?: string;
  format: DateFormat;
};

export function getDateDisplay({ ad, bs, format }: DateInput) {
  const adValue = ad && isValidIso(ad) ? ad.slice(0, 10) : "";
  const bsValue = bs && isValidBs(bs) ? bs : "";

  const derivedBs = bsValue || (adValue ? toBs(adValue) : "");
  const derivedAd = adValue || (bsValue ? toAd(bsValue) : "");
  const adDisplay = derivedAd ? derivedAd.slice(0, 10) : "";
  const bsDisplay = derivedBs || "";

  const primary = format === "bs" ? bsDisplay : adDisplay;
  const secondary = format === "bs" ? adDisplay : bsDisplay;

  return {
    primary: primary || "--",
    secondary: secondary || "",
    bs: bsDisplay || "--",
    ad: adDisplay || "",
  };
}

export function getDateLabel(format: DateFormat, label = "Date") {
  return `${label} (${format.toUpperCase()})`;
}

export function formatDisplayDate(
  value: { ad: string; bs: string },
  preference: "BS" | "AD"
): { primary: string; secondary: string } {
  const adRaw = value.ad?.slice(0, 10) ?? "";
  const bsRaw = value.bs ?? "";

  let adValue = adRaw;
  let bsValue = bsRaw;

  if (adValue && !bsValue) {
    try {
      bsValue = adToBs(adValue);
    } catch {
      // ignore
    }
  }

  if (bsValue && !adValue) {
    try {
      adValue = bsToAd(bsValue);
    } catch {
      // ignore
    }
  }

  const primary = preference === "AD" ? adValue : bsValue;
  const secondaryRaw = preference === "AD" ? bsValue : adValue;

  return {
    primary: primary || "--",
    secondary: secondaryRaw ? `(${secondaryRaw})` : ""
  };
}
