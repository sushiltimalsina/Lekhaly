import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
type DraftInput = {
    voucherType?: VoucherType;
    voucherDate?: Date;
    voucherDateBs?: string;
    partyId?: string;
    memo?: string;
    lines?: Array<{
        accountId?: string;
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
    private enforceVoucherRules;
    private toJsonSafe;
    private idempotencyGuard;
    private storeIdempotency;
    private getCompanyOrThrow;
    private ensureVoucherDate;
    private validateReferences;
    private buildTaxLines;
    private normalizeLines;
    private computeTotals;
    createDraft(user: AuthUser, input: DraftInput, idempotencyKey?: string): Promise<Prisma.JsonValue | ({
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
        voucherDateBs: string | null;
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
    })>;
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
        voucherDateBs: string | null;
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
    post(user: AuthUser, voucherId: string, idempotencyKey?: string): Promise<Prisma.JsonValue | ({
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
        voucherDateBs: string | null;
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
    })>;
    void(user: AuthUser, voucherId: string, idempotencyKey?: string): Promise<Prisma.JsonValue | {
        voidedVoucherId: string;
        reversalVoucherId: string;
    }>;
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
        voucherDateBs: string | null;
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
        q?: string;
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
        voucherDateBs: string | null;
        memo: string | null;
        postedAt: Date | null;
        createdAt: Date;
        party: {
            id: string;
            name: string;
        } | null;
        partyId: string | null;
    }[]>;
    listAttachments(user: AuthUser, voucherId: string): Promise<({
        uploadedByUser: {
            id: string;
            name: string | null;
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        voucherId: string;
        uploadedByUserId: string | null;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        storageKey: string;
    })[]>;
    getAttachmentUrl(user: AuthUser, voucherId: string, attachmentId: string): Promise<{
        attachmentId: string;
        fileName: string;
        mimeType: string;
        url: string;
        expiresAt: Date;
    }>;
    addAttachment(user: AuthUser, voucherId: string, input: {
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        storageKey: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        voucherId: string;
        uploadedByUserId: string | null;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        storageKey: string;
    }>;
    removeAttachment(user: AuthUser, voucherId: string, attachmentId: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
}
export {};
