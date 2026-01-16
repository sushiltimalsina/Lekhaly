import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
type DraftInput = {
    voucherType?: VoucherType;
    voucherDate?: Date;
    partyId?: string;
    memo?: string;
    lines?: Array<{
        accountId: string;
        partyId?: string;
        itemId?: string;
        description?: string;
        debit?: number;
        credit?: number;
        taxCodeId?: string;
        taxAmount?: number;
    }>;
};
export declare class VouchersService {
    private prisma;
    constructor(prisma: PrismaService);
    private getCompanyOrThrow;
    private ensureVoucherDate;
    private validateReferences;
    private normalizeLines;
    private computeTotals;
    createDraft(user: AuthUser, input: DraftInput): Promise<{
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
            lineNo: number;
            voucherId: string;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        voucherNumber: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    }>;
    updateDraft(user: AuthUser, voucherId: string, input: DraftInput): Promise<({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
            lineNo: number;
            voucherId: string;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        voucherNumber: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    }) | null>;
    preview(user: AuthUser, voucherId: string): Promise<{
        voucherId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        totalDebit: Prisma.Decimal;
        totalCredit: Prisma.Decimal;
        balanced: boolean;
    }>;
    post(user: AuthUser, voucherId: string): Promise<({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
            lineNo: number;
            voucherId: string;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        voucherNumber: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    }) | null>;
    void(user: AuthUser, voucherId: string): Promise<{
        voidedVoucherId: string;
        reversalVoucherId: string;
    }>;
    getById(user: AuthUser, voucherId: string): Promise<{
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
            lineNo: number;
            voucherId: string;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        voucherNumber: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    }>;
    list(user: AuthUser, filters: {
        status?: VoucherStatus;
        voucherType?: VoucherType;
        partyId?: string;
        from?: Date;
        to?: Date;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        voucherNumber: string | null;
        postedAt: Date | null;
    }[]>;
}
export {};
