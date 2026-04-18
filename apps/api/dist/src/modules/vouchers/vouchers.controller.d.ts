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
            partyId: string | null;
            voucherId: string;
            accountId: string;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            itemId: string | null;
            taxCodeId: string | null;
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
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        memo: string | null;
        additionalNote: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        partyId: string | null;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
        fiscalSessionId: string | null;
    })>;
    updateDraft(user: AuthUser, id: string, body: any): Promise<({
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            partyId: string | null;
            voucherId: string;
            accountId: string;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            itemId: string | null;
            taxCodeId: string | null;
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
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        memo: string | null;
        additionalNote: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        partyId: string | null;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
        fiscalSessionId: string | null;
    }) | null>;
    getById(user: AuthUser, id: string): Promise<{
        party: {
            id: string;
            name: string;
        } | null;
        lines: {
            id: string;
            companyId: string;
            createdAt: Date;
            partyId: string | null;
            voucherId: string;
            accountId: string;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            itemId: string | null;
            taxCodeId: string | null;
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
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        memo: string | null;
        additionalNote: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        partyId: string | null;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
        fiscalSessionId: string | null;
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
            stockLedger: {
                id: string;
                itemId: string;
                rate: import("@prisma/client/runtime/client").Decimal;
                qtyIn: import("@prisma/client/runtime/client").Decimal;
                qtyOut: import("@prisma/client/runtime/client").Decimal;
            }[];
            party: {
                id: string;
                name: string;
                panNumber: string | null;
                vatNumber: string | null;
            } | null;
            lines: ({
                party: {
                    id: string;
                    name: string;
                } | null;
                item: {
                    id: string;
                    name: string;
                    sku: string | null;
                } | null;
                account: {
                    id: string;
                    name: string;
                    code: string;
                };
            } & {
                id: string;
                companyId: string;
                createdAt: Date;
                partyId: string | null;
                voucherId: string;
                accountId: string;
                lineNo: number;
                description: string | null;
                debit: import("@prisma/client/runtime/client").Decimal;
                credit: import("@prisma/client/runtime/client").Decimal;
                qty: import("@prisma/client/runtime/client").Decimal;
                taxAmount: import("@prisma/client/runtime/client").Decimal;
                itemId: string | null;
                taxCodeId: string | null;
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
            vendorInvoiceNo: string | null;
            vendorInvoiceDate: Date | null;
            memo: string | null;
            additionalNote: string | null;
            source: string;
            postedAt: Date | null;
            voidedAt: Date | null;
            partyId: string | null;
            createdByUserId: string | null;
            postedByUserId: string | null;
            voidedByUserId: string | null;
            reversalOfVoucherId: string | null;
            revisionOfVoucherId: string | null;
            fiscalSessionId: string | null;
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
            email: string;
            name: string | null;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
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
        companyId: string;
        createdAt: Date;
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
            companyId: string;
            createdAt: Date;
            partyId: string | null;
            voucherId: string;
            accountId: string;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            itemId: string | null;
            taxCodeId: string | null;
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
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        memo: string | null;
        additionalNote: string | null;
        source: string;
        postedAt: Date | null;
        voidedAt: Date | null;
        partyId: string | null;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
        fiscalSessionId: string | null;
    })>;
    void(user: AuthUser, id: string, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | {
        voidedVoucherId: string;
        reversalVoucherId: string;
    }>;
}
