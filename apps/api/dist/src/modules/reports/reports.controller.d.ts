import type { AuthUser } from "../../common/auth/auth.types";
import { ReportsService } from "./reports.service";
export declare class ReportsController {
    private reports;
    constructor(reports: ReportsService);
    trialBalance(user: AuthUser, query: any): Promise<{
        rows: {
            accountCode: string;
            accountName: string;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
        }[];
        totalDebit: import("@prisma/client/runtime/client").Decimal;
        totalCredit: import("@prisma/client/runtime/client").Decimal;
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
    }>;
    export(body: {
        report: string;
    }): {
        ok: boolean;
        report: string;
    };
}
