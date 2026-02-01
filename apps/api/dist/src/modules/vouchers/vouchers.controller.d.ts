import type { AuthUser } from "../../common/auth/auth.types";
import { VouchersService } from "./vouchers.service";
export declare class VouchersController {
    private vouchers;
    constructor(vouchers: VouchersService);
    createDraft(user: AuthUser, body: any, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | {
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
    updateDraft(user: AuthUser, id: string, body: any): Promise<({
        lines: {
            id: string;
            createdAt: Date;
            companyId: string;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
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
    getById(user: AuthUser, id: string): Promise<{
        lines: {
            id: string;
            createdAt: Date;
            companyId: string;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
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
    preview(user: AuthUser, id: string): Promise<{
        voucherId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        totalDebit: import("@prisma/client/runtime/client").Decimal;
        totalCredit: import("@prisma/client/runtime/client").Decimal;
        balanced: boolean;
    }>;
    list(user: AuthUser, query: any): Promise<{
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
    }[]>;
    listAttachments(user: AuthUser, id: string): Promise<({
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
    attachmentUrl(user: AuthUser, id: string, attachmentId: string): Promise<{
        attachmentId: string;
        fileName: string;
        mimeType: string;
        url: string;
        expiresAt: Date;
    }>;
    addAttachment(user: AuthUser, id: string, body: any): Promise<{
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
    removeAttachment(user: AuthUser, id: string, attachmentId: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    post(user: AuthUser, id: string, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | ({
        lines: {
            id: string;
            createdAt: Date;
            companyId: string;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
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
    void(user: AuthUser, id: string, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | {
        voidedVoucherId: string;
        reversalVoucherId: string;
    }>;
}
