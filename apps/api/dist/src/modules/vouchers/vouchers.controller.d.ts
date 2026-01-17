import type { AuthUser } from "../../common/auth/auth.types";
import { VouchersService } from "./vouchers.service";
export declare class VouchersController {
    private vouchers;
    constructor(vouchers: VouchersService);
    createDraft(user: AuthUser, body: any, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | ({
        lines: {
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            id: string;
            companyId: string;
            createdAt: Date;
            lineNo: number;
            voucherId: string;
        }[];
    } & {
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        voucherNumber: string | null;
        id: string;
        companyId: string;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    })>;
    updateDraft(user: AuthUser, id: string, body: any): Promise<({
        lines: {
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            id: string;
            companyId: string;
            createdAt: Date;
            lineNo: number;
            voucherId: string;
        }[];
    } & {
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        voucherNumber: string | null;
        id: string;
        companyId: string;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    }) | null>;
    getById(user: AuthUser, id: string): Promise<{
        lines: {
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            id: string;
            companyId: string;
            createdAt: Date;
            lineNo: number;
            voucherId: string;
        }[];
    } & {
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        voucherNumber: string | null;
        id: string;
        companyId: string;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
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
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        voucherNumber: string | null;
        id: string;
        postedAt: Date | null;
        createdAt: Date;
    }[]>;
    post(user: AuthUser, id: string, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | ({
        lines: {
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            id: string;
            companyId: string;
            createdAt: Date;
            lineNo: number;
            voucherId: string;
        }[];
    } & {
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        voucherNumber: string | null;
        id: string;
        companyId: string;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
    })>;
    void(user: AuthUser, id: string, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | {
        voidedVoucherId: string;
        reversalVoucherId: string;
    }>;
}
