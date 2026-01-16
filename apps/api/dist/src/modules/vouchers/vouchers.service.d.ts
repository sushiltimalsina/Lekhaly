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
    private idempotencyGuard;
    private storeIdempotency;
    private getCompanyOrThrow;
    private ensureVoucherDate;
    private validateReferences;
    private normalizeLines;
    private computeTotals;
    createDraft(user: AuthUser, input: DraftInput, idempotencyKey?: string): Promise<any>;
    updateDraft(user: AuthUser, voucherId: string, input: DraftInput): Promise<({
        lines: {
            id: string;
            createdAt: Date;
            companyId: string;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            accountId: string;
            itemId: string | null;
            taxCodeId: string | null;
            voucherId: string;
        }[];
    } & {
        id: string;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        status: import("@prisma/client").$Enums.VoucherStatus;
        voucherNumber: string | null;
        voucherDate: Date;
        memo: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        partyId: string | null;
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
    post(user: AuthUser, voucherId: string, idempotencyKey?: string): Promise<any>;
    void(user: AuthUser, voucherId: string, idempotencyKey?: string): Promise<any>;
    getById(user: AuthUser, voucherId: string): Promise<{
        lines: {
            id: string;
            createdAt: Date;
            companyId: string;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            accountId: string;
            itemId: string | null;
            taxCodeId: string | null;
            voucherId: string;
        }[];
    } & {
        id: string;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        status: import("@prisma/client").$Enums.VoucherStatus;
        voucherNumber: string | null;
        voucherDate: Date;
        memo: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        partyId: string | null;
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
        createdByUserId?: string;
        postedByUserId?: string;
        voidedByUserId?: string;
        voucherNumber?: string;
        memo?: string;
        from?: Date;
        to?: Date;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        status: import("@prisma/client").$Enums.VoucherStatus;
        voucherNumber: string | null;
        voucherDate: Date;
        memo: string | null;
        postedAt: Date | null;
        createdAt: Date;
        partyId: string | null;
    }[]>;
}
export {};
