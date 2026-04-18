import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class ExpensesService {
    private prisma;
    constructor(prisma: PrismaService);
    private validateRefs;
    private buildVoucherLines;
    createDraft(user: AuthUser, input: any): Promise<{
        id: string;
        date: Date;
        dateBs: string | null;
        amount: Prisma.Decimal;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        voucherId: string | null;
        vendorId: string | null;
        taxCodeId: string | null;
        attachmentId: string | null;
    }>;
    preview(user: AuthUser, input: any): Promise<{
        total: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        lines: ({
            accountId: string;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            description: string;
            taxCodeId?: undefined;
            taxAmount?: undefined;
        } | {
            accountId: string;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            description: string;
            taxCodeId: string | undefined;
            taxAmount: Prisma.Decimal;
        })[];
    }>;
    post(user: AuthUser, expenseId: string, input: any): Promise<{
        id: string;
        date: Date;
        dateBs: string | null;
        amount: Prisma.Decimal;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        voucherId: string | null;
        vendorId: string | null;
        taxCodeId: string | null;
        attachmentId: string | null;
    }>;
    list(user: AuthUser, filters: {
        from?: Date;
        to?: Date;
        status?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        date: Date;
        dateBs: string | null;
        amount: Prisma.Decimal;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        voucherId: string | null;
        vendorId: string | null;
        taxCodeId: string | null;
        attachmentId: string | null;
    }[]>;
}
