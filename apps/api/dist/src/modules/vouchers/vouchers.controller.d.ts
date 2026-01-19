import type { AuthUser } from "../../common/auth/auth.types";
import { VouchersService } from "./vouchers.service";
export declare class VouchersController {
    private vouchers;
    constructor(vouchers: VouchersService);
    createDraft(user: AuthUser, body: any, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | ({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            partyId: string | null;
            taxCodeId: string | null;
            voucherId: string;
            lineNo: number;
            accountId: string;
            itemId: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        voucherDate: Date;
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
    updateDraft(user: AuthUser, id: string, body: any): Promise<({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            partyId: string | null;
            taxCodeId: string | null;
            voucherId: string;
            lineNo: number;
            accountId: string;
            itemId: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        voucherDate: Date;
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
    getById(user: AuthUser, id: string): Promise<{
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            partyId: string | null;
            taxCodeId: string | null;
            voucherId: string;
            lineNo: number;
            accountId: string;
            itemId: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        voucherDate: Date;
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
    preview(user: AuthUser, id: string): Promise<{
        voucherId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        totalDebit: import("@prisma/client/runtime/client").Decimal;
        totalCredit: import("@prisma/client/runtime/client").Decimal;
        balanced: boolean;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        party: {
            id: string;
            name: string;
        } | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        voucherDate: Date;
        partyId: string | null;
        memo: string | null;
        postedAt: Date | null;
    }[]>;
    listAttachments(user: AuthUser, id: string): Promise<({
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
    attachmentUrl(user: AuthUser, id: string, attachmentId: string): Promise<{
        attachmentId: string;
        fileName: string;
        mimeType: string;
        url: string;
        expiresAt: Date;
    }>;
    addAttachment(user: AuthUser, id: string, body: any): Promise<{
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
    removeAttachment(user: AuthUser, id: string, attachmentId: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    post(user: AuthUser, id: string, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | ({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            partyId: string | null;
            taxCodeId: string | null;
            voucherId: string;
            lineNo: number;
            accountId: string;
            itemId: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        voucherDate: Date;
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
    void(user: AuthUser, id: string, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | {
        voidedVoucherId: string;
        reversalVoucherId: string;
    }>;
}
