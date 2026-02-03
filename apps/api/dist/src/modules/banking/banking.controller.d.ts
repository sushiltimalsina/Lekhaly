import type { AuthUser } from "../../common/auth/auth.types";
import { BankingService } from "./banking.service";
export declare class BankingController {
    private banking;
    constructor(banking: BankingService);
    createBankAccount(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        bankName: string | null;
        accountNumber: string | null;
    }>;
    createStatement(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        bankAccountId: string;
        periodFrom: Date;
        periodFromBs: string | null;
        periodTo: Date;
        periodToBs: string | null;
        openingBalance: import("@prisma/client/runtime/client").Decimal;
        closingBalance: import("@prisma/client/runtime/client").Decimal;
    }>;
    addStatementLine(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        description: string | null;
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        debitCredit: string;
        statementId: string;
        matchedVoucherId: string | null;
        matchedLineId: string | null;
    }>;
    reconcile(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        description: string | null;
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        debitCredit: string;
        statementId: string;
        matchedVoucherId: string | null;
        matchedLineId: string | null;
    }>;
    unmatch(user: AuthUser, lineId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        description: string | null;
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        debitCredit: string;
        statementId: string;
        matchedVoucherId: string | null;
        matchedLineId: string | null;
    }>;
    listStatements(user: AuthUser, query: any): Promise<({
        bankAccount: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            bankName: string | null;
            accountNumber: string | null;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        bankAccountId: string;
        periodFrom: Date;
        periodFromBs: string | null;
        periodTo: Date;
        periodToBs: string | null;
        openingBalance: import("@prisma/client/runtime/client").Decimal;
        closingBalance: import("@prisma/client/runtime/client").Decimal;
    })[]>;
    getStatement(user: AuthUser, id: string): Promise<{
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            date: Date;
            dateBs: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            debitCredit: string;
            statementId: string;
            matchedVoucherId: string | null;
            matchedLineId: string | null;
        }[];
        bankAccount: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            bankName: string | null;
            accountNumber: string | null;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        bankAccountId: string;
        periodFrom: Date;
        periodFromBs: string | null;
        periodTo: Date;
        periodToBs: string | null;
        openingBalance: import("@prisma/client/runtime/client").Decimal;
        closingBalance: import("@prisma/client/runtime/client").Decimal;
    }>;
    connectSync(user: AuthUser, body: any): Promise<{
        provider: string;
        status: string;
        message: string;
    }>;
    syncStatus(user: AuthUser): Promise<{
        status: string;
        lastSyncedAt: null;
    }>;
    refreshSync(user: AuthUser): Promise<{
        status: string;
        message: string;
    }>;
}
