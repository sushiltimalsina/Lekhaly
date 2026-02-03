import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
type DraftInput = {
    voucherType?: VoucherType;
    voucherDate?: Date;
    voucherDateBs?: string;
    partyId?: string;
    referenceNo?: string;
    memo?: string;
    lines?: Array<{
        accountId?: string;
        partyId?: string;
        itemId?: string;
        description?: string;
        debit?: number;
        credit?: number;
        qty?: number;
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
            companyId: string;
            createdAt: Date;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            voucherId: string;
            lineNo: number;
            description: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            qty: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        partyId: string | null;
        memo: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    })>;
    updateDraft(user: AuthUser, voucherId: string, input: DraftInput): Promise<({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            voucherId: string;
            lineNo: number;
            description: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            qty: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        partyId: string | null;
        memo: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
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
            companyId: string;
            createdAt: Date;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            voucherId: string;
            lineNo: number;
            description: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            qty: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        partyId: string | null;
        memo: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
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
            companyId: string;
            createdAt: Date;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            voucherId: string;
            lineNo: number;
            description: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            qty: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        partyId: string | null;
        memo: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
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
    }): Promise<({
        stockLedger: {
            id: string;
            rate: Prisma.Decimal;
            itemId: string;
            qtyIn: Prisma.Decimal;
            qtyOut: Prisma.Decimal;
        }[];
        party: {
            id: string;
            name: string;
            panNumber: string | null;
            vatNumber: string | null;
        } | null;
        lines: ({
            item: {
                id: string;
                name: string;
                sku: string | null;
            } | null;
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            voucherId: string;
            lineNo: number;
            description: string | null;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            qty: Prisma.Decimal;
            taxCodeId: string | null;
            taxAmount: Prisma.Decimal;
        })[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        partyId: string | null;
        memo: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    })[]>;
    listAttachments(user: AuthUser, voucherId: string): Promise<({
        uploadedByUser: {
            id: string;
            email: string;
            name: string | null;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        voucherId: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        storageKey: string;
        uploadedByUserId: string | null;
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
        companyId: string;
        createdAt: Date;
        voucherId: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        storageKey: string;
        uploadedByUserId: string | null;
    }>;
    removeAttachment(user: AuthUser, voucherId: string, attachmentId: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
}
export {};
