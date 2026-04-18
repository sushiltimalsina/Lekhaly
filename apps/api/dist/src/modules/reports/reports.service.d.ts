import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { OutboxService } from "../outbox/outbox.service";
type ReportFilters = {
    from?: Date;
    fromBs?: string;
    to?: Date;
    toBs?: string;
};
type PartyAgingFilters = ReportFilters & {
    asOf?: Date;
    asOfBs?: string;
};
type LedgerFilters = {
    accountId?: string;
    partyId?: string;
    from?: Date;
    fromBs?: string;
    to?: Date;
    toBs?: string;
};
export declare class ReportsService {
    private prisma;
    private outbox;
    constructor(prisma: PrismaService, outbox: OutboxService);
    private getCompany;
    private resolveReportRange;
    private sumLines;
    private applyDateFilter;
    private formatAmount;
    private formatDateRange;
    private buildTrialBalanceText;
    private buildProfitLossText;
    private buildBalanceSheetText;
    private toCsv;
    private buildTrialBalanceCsv;
    private buildProfitLossCsv;
    private buildBalanceSheetCsv;
    trialBalance(companyId: string, filters: ReportFilters): Promise<{
        rows: {
            accountCode: string;
            accountName: string;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
        }[];
        totalDebit: Prisma.Decimal;
        totalCredit: Prisma.Decimal;
        balanced: boolean;
    }>;
    profitAndLoss(companyId: string, filters: ReportFilters): Promise<{
        income: {
            label: string;
            amount: Prisma.Decimal;
        }[];
        expense: {
            label: string;
            amount: Prisma.Decimal;
        }[];
        totalIncome: Prisma.Decimal;
        totalExpense: Prisma.Decimal;
        netProfit: Prisma.Decimal;
    }>;
    balanceSheet(companyId: string, filters: ReportFilters): Promise<{
        assets: {
            label: string;
            amount: Prisma.Decimal;
        }[];
        liabilities: {
            label: string;
            amount: Prisma.Decimal;
        }[];
        equity: {
            label: string;
            amount: Prisma.Decimal;
        }[];
        totalAssets: Prisma.Decimal;
        totalLiabilities: Prisma.Decimal;
        totalEquity: Prisma.Decimal;
        netProfit: Prisma.Decimal;
        totalEquityWithProfit: Prisma.Decimal;
        balanced: boolean;
    }>;
    partyAging(companyId: string, filters: PartyAgingFilters): Promise<{
        asOf: Date;
        rows: {
            partyId: string;
            partyName: string;
            buckets: Record<string, Prisma.Decimal>;
            total: Prisma.Decimal;
        }[];
    }>;
    partyLedger(companyId: string, filters: LedgerFilters): Promise<{
        accountId: string | undefined;
        partyId: string | undefined;
        openingBalance: Prisma.Decimal;
        rows: {
            date: Date;
            dateBs: string | null;
            ref: string | null;
            memo: string;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            balance: Prisma.Decimal;
        }[];
        balance: Prisma.Decimal;
    }>;
    exportPdf(companyId: string, input: {
        report: string;
        format?: string;
        from?: Date;
        to?: Date;
    }): Promise<{
        report: string;
        generatedAt: Date;
        format: string;
        fileName: string;
        contentType: string;
        contentBase64: string;
        data: any;
    }>;
}
export {};
