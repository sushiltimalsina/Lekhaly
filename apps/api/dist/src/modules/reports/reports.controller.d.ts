import type { AuthUser } from "../../common/auth/auth.types";
import { ReportsService } from "./reports.service";
import { DashboardService } from "./dashboard.service";
export declare class ReportsController {
    private reports;
    private dashboard;
    constructor(reports: ReportsService, dashboard: DashboardService);
    getDashboardStats(user: AuthUser, calendar?: "AD" | "BS"): Promise<{
        revenue: number;
        revenueTrend: number;
        receivables: number;
        receivablesTrend: number;
        payables: number;
        payablesTrend: number;
        cashAtHand: number;
        cashTrend: number;
        quickRatio: number;
        burnRate: number;
        runway: number;
        recentActivity: {
            id: string;
            type: import("@prisma/client").$Enums.VoucherType;
            number: string | null;
            partyName: string;
            amount: number;
            date: Date;
        }[];
    }>;
    getDashboardCharts(user: AuthUser): Promise<{
        name: string;
        revenue: import("@prisma/client/runtime/client").Decimal;
        expense: import("@prisma/client/runtime/client").Decimal;
    }[]>;
    trialBalance(user: AuthUser, query: any): Promise<{
        rows: {
            accountCode: string;
            accountName: string;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
        }[];
        totalDebit: import("@prisma/client/runtime/client").Decimal;
        totalCredit: import("@prisma/client/runtime/client").Decimal;
        balanced: boolean;
    }>;
    profitLoss(user: AuthUser, query: any): Promise<{
        income: {
            label: string;
            amount: import("@prisma/client/runtime/client").Decimal;
        }[];
        expense: {
            label: string;
            amount: import("@prisma/client/runtime/client").Decimal;
        }[];
        totalIncome: import("@prisma/client/runtime/client").Decimal;
        totalExpense: import("@prisma/client/runtime/client").Decimal;
        netProfit: import("@prisma/client/runtime/client").Decimal;
    }>;
    balanceSheet(user: AuthUser, query: any): Promise<{
        assets: {
            label: string;
            amount: import("@prisma/client/runtime/client").Decimal;
        }[];
        liabilities: {
            label: string;
            amount: import("@prisma/client/runtime/client").Decimal;
        }[];
        equity: {
            label: string;
            amount: import("@prisma/client/runtime/client").Decimal;
        }[];
        totalAssets: import("@prisma/client/runtime/client").Decimal;
        totalLiabilities: import("@prisma/client/runtime/client").Decimal;
        totalEquity: import("@prisma/client/runtime/client").Decimal;
        netProfit: import("@prisma/client/runtime/client").Decimal;
        totalEquityWithProfit: import("@prisma/client/runtime/client").Decimal;
        balanced: boolean;
    }>;
    partyAging(user: AuthUser, query: any): Promise<{
        asOf: Date;
        rows: {
            partyId: string;
            partyName: string;
            buckets: Record<string, import("@prisma/client/runtime/client").Decimal>;
            total: import("@prisma/client/runtime/client").Decimal;
        }[];
    }>;
    partyLedger(user: AuthUser, query: any): Promise<{
        accountId: string | undefined;
        partyId: string | undefined;
        openingBalance: import("@prisma/client/runtime/client").Decimal;
        rows: {
            date: Date;
            dateBs: string | null;
            ref: string | null;
            memo: string;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            balance: import("@prisma/client/runtime/client").Decimal;
        }[];
        balance: import("@prisma/client/runtime/client").Decimal;
    }>;
    export(user: AuthUser, body: any): Promise<{
        report: string;
        generatedAt: Date;
        format: string;
        fileName: string;
        contentType: string;
        contentBase64: string;
        data: any;
    }>;
}
