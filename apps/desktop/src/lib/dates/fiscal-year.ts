import { adToBs, bsToAd } from "./convert";

export type DualCalendarDate = { ad: string; bs: string };

export function getFiscalYearEndDate(startBs: string): DualCalendarDate {
  if (!startBs) return { ad: "", bs: "" };
  const [year, month, day] = startBs.split("-").map(Number);
  let nextYearStartAd = "";

  for (let candidateDay = day; candidateDay > 0; candidateDay -= 1) {
    const candidateBs = `${year + 1}-${String(month).padStart(2, "0")}-${String(candidateDay).padStart(2, "0")}`;
    try {
      const candidateAd = bsToAd(candidateBs);
      if (adToBs(candidateAd) === candidateBs) {
        nextYearStartAd = candidateAd;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!nextYearStartAd) return { ad: "", bs: "" };
  const endAdDate = new Date(`${nextYearStartAd}T12:00:00.000Z`);
  endAdDate.setUTCDate(endAdDate.getUTCDate() - 1);
  const ad = endAdDate.toISOString().slice(0, 10);
  return { ad, bs: adToBs(ad) };
}
