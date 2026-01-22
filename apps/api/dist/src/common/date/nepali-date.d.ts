export declare function bsToAdDate(bs: string): Date;
export declare function adToBsDate(ad: Date): string;
export declare function parseBsDate(bs: string): {
    year: number;
    month: number;
    day: number;
};
export declare function getCurrentBsDate(): string;
export declare function bsFiscalYearRange(currentBs: string, fiscalYearStartMonth: number): {
    from: Date;
    to: Date;
    fromBs: string;
    toBs: string;
};
export declare function resolveAdDate(input?: Date, bs?: string): {
    date: Date;
    bs?: string;
};
