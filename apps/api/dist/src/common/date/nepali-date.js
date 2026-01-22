"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bsToAdDate = bsToAdDate;
exports.adToBsDate = adToBsDate;
exports.parseBsDate = parseBsDate;
exports.getCurrentBsDate = getCurrentBsDate;
exports.bsFiscalYearRange = bsFiscalYearRange;
exports.resolveAdDate = resolveAdDate;
const common_1 = require("@nestjs/common");
const nepali_date_converter_1 = __importDefault(require("nepali-date-converter"));
const BS_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
function bsToAdDate(bs) {
    const match = BS_REGEX.exec(bs);
    if (!match) {
        throw new common_1.BadRequestException("Invalid BS date format. Use YYYY-MM-DD.");
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const nepali = new nepali_date_converter_1.default(year, month, day);
    return nepali.toJsDate();
}
function adToBsDate(ad) {
    const nepali = new nepali_date_converter_1.default(ad);
    return nepali.format("YYYY-MM-DD");
}
function parseBsDate(bs) {
    const match = BS_REGEX.exec(bs);
    if (!match) {
        throw new common_1.BadRequestException("Invalid BS date format. Use YYYY-MM-DD.");
    }
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}
function getCurrentBsDate() {
    return adToBsDate(new Date());
}
function pad2(value) {
    return value.toString().padStart(2, "0");
}
function bsFiscalYearRange(currentBs, fiscalYearStartMonth) {
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
function resolveAdDate(input, bs) {
    if (input)
        return { date: input, bs };
    if (bs)
        return { date: bsToAdDate(bs), bs };
    throw new common_1.BadRequestException("Date is required");
}
//# sourceMappingURL=nepali-date.js.map