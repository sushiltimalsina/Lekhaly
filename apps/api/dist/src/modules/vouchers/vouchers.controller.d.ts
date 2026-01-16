import type { AuthUser } from "../../common/auth/auth.types";
import { VouchersService } from "./vouchers.service";
export declare class VouchersController {
    private vouchers;
    constructor(vouchers: VouchersService);
    createDraft(user: AuthUser, body: any): Promise<{
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
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
    updateDraft(user: AuthUser, id: string, body: any): Promise<({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
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
    getById(user: AuthUser, id: string): Promise<{
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
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
        partyId: string | null;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherDate: Date;
        memo: string | null;
        voucherNumber: string | null;
        postedAt: Date | null;
    }[]>;
    post(user: AuthUser, id: string): Promise<({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            description: string | null;
            accountId: string;
            partyId: string | null;
            itemId: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
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
    void(user: AuthUser, id: string): Promise<{
        voidedVoucherId: string;
        reversalVoucherId: string;
    }>;
}
