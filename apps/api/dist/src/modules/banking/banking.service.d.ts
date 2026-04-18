import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class BankingService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureBankAccount;
    createBankAccount(user: AuthUser, input: {
        accountId: string;
        bankName?: string;
        accountNumber?: string;
    }): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        bankName: string | null;
        accountNumber: string | null;
    }>;
    listStatements(user: AuthUser, filters: {
        bankAccountId?: string;
        from?: Date;
        to?: Date;
        skip?: number;
        take?: number;
    }): Promise<({
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
        openingBalance: Prisma.Decimal;
        closingBalance: Prisma.Decimal;
    })[]>;
    getStatement(user: AuthUser, statementId: string): Promise<{
        bankAccount: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            bankName: string | null;
            accountNumber: string | null;
        };
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            date: Date;
            dateBs: string | null;
            description: string | null;
            amount: Prisma.Decimal;
            statementId: string;
            debitCredit: string;
            matchedVoucherId: string | null;
            matchedLineId: string | null;
        }[];
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
        openingBalance: Prisma.Decimal;
        closingBalance: Prisma.Decimal;
    }>;
    createStatement(user: AuthUser, input: {
        bankAccountId: string;
        periodFrom?: Date;
        periodFromBs?: string;
        periodTo?: Date;
        periodToBs?: string;
        openingBalance: number;
        closingBalance: number;
    }): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        bankAccountId: string;
        periodFrom: Date;
        periodFromBs: string | null;
        periodTo: Date;
        periodToBs: string | null;
        openingBalance: Prisma.Decimal;
        closingBalance: Prisma.Decimal;
    }>;
    addStatementLine(user: AuthUser, statementId: string, input: {
        date?: Date;
        dateBs?: string;
        description?: string;
        amount: number;
        debitCredit: "debit" | "credit";
    }): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        date: Date;
        dateBs: string | null;
        description: string | null;
        amount: Prisma.Decimal;
        statementId: string;
        debitCredit: string;
        matchedVoucherId: string | null;
        matchedLineId: string | null;
    }>;
    reconcile(user: AuthUser, input: {
        statementLineId: string;
        voucherId: string;
        voucherLineId?: string;
    }): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        date: Date;
        dateBs: string | null;
        description: string | null;
        amount: Prisma.Decimal;
        statementId: string;
        debitCredit: string;
        matchedVoucherId: string | null;
        matchedLineId: string | null;
    }>;
    unmatch(user: AuthUser, lineId: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        date: Date;
        dateBs: string | null;
        description: string | null;
        amount: Prisma.Decimal;
        statementId: string;
        debitCredit: string;
        matchedVoucherId: string | null;
        matchedLineId: string | null;
    }>;
    connectBankSync(user: AuthUser, input: {
        provider: string;
        bankAccountId?: string;
    }): Promise<{
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
