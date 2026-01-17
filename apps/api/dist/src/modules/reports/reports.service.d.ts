import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
type ReportFilters = {
    from?: Date;
    to?: Date;
};
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private sumLines;
    private applyDateFilter;
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
}
export {};
