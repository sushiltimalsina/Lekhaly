import type { AuthUser } from "../../common/auth/auth.types";
import { VouchersService } from "./vouchers.service";
export declare class VouchersController {
    private vouchers;
    constructor(vouchers: VouchersService);
    createDraft(user: AuthUser, body: any, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | ({
        lines: {
            id: string;
            createdAt: Date;
            companyId: string;
            partyId: string | null;
            voucherId: string;
            lineNo: number;
            accountId: string;
            itemId: string | null;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        id: string;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        status: import("@prisma/client").$Enums.VoucherStatus;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        memo: string | null;
        additionalNote: string | null;
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
    updateDraft(user: AuthUser, id: string, body: any): Promise<({
        lines: {
            id: string;
            createdAt: Date;
            companyId: string;
            partyId: string | null;
            voucherId: string;
            lineNo: number;
            accountId: string;
            itemId: string | null;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        id: string;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        status: import("@prisma/client").$Enums.VoucherStatus;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        memo: string | null;
        additionalNote: string | null;
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
            voucherId: string;
            lineNo: number;
            accountId: string;
            itemId: string | null;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
        party: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        status: import("@prisma/client").$Enums.VoucherStatus;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        memo: string | null;
        additionalNote: string | null;
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
        data: ({
            lines: ({
                party: {
                    id: string;
                    name: string;
                } | null;
                account: {
                    id: string;
                    name: string;
                    code: string;
                };
                item: {
                    id: string;
                    name: string;
                    sku: string | null;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                companyId: string;
                partyId: string | null;
                voucherId: string;
                lineNo: number;
                accountId: string;
                itemId: string | null;
                description: string | null;
                debit: import("@prisma/client/runtime/client").Decimal;
                credit: import("@prisma/client/runtime/client").Decimal;
                qty: import("@prisma/client/runtime/client").Decimal;
                taxCodeId: string | null;
                taxAmount: import("@prisma/client/runtime/client").Decimal;
            })[];
            party: {
                id: string;
                name: string;
                panNumber: string | null;
                vatNumber: string | null;
            } | null;
            stockLedger: {
                id: string;
                itemId: string;
                qtyIn: import("@prisma/client/runtime/client").Decimal;
                qtyOut: import("@prisma/client/runtime/client").Decimal;
                rate: import("@prisma/client/runtime/client").Decimal;
            }[];
        } & {
            id: string;
            voucherType: import("@prisma/client").$Enums.VoucherType;
            status: import("@prisma/client").$Enums.VoucherStatus;
            voucherNumber: string | null;
            referenceNo: string | null;
            voucherDate: Date;
            voucherDateBs: string | null;
            vendorInvoiceNo: string | null;
            vendorInvoiceDate: Date | null;
            memo: string | null;
            additionalNote: string | null;
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
        })[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
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
            voucherId: string;
            lineNo: number;
            accountId: string;
            itemId: string | null;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        id: string;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        status: import("@prisma/client").$Enums.VoucherStatus;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        memo: string | null;
        additionalNote: string | null;
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
