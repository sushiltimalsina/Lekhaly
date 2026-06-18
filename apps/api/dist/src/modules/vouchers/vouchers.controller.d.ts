import type { AuthUser } from "../../common/auth/auth.types";
import { VouchersService } from "./vouchers.service";
export declare class VouchersController {
    private vouchers;
    constructor(vouchers: VouchersService);
    createDraft(user: AuthUser, body: any, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | ({
        lines: {
            itemId: string | null;
            qty: import("@prisma/client/runtime/client").Decimal;
            accountId: string;
            warehouseId: string | null;
            binId: string | null;
            batchNo: string | null;
            lotNo: string | null;
            expiryDate: Date | null;
            expiryDateBs: string | null;
            serialNumbers: string[];
            voucherId: string;
            id: string;
            companyId: string;
            createdAt: Date;
            taxCodeId: string | null;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        partyId: string | null;
        additionalNote: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
        fiscalSessionId: string | null;
    })>;
    updateDraft(user: AuthUser, id: string, body: any): Promise<({
        lines: {
            itemId: string | null;
            qty: import("@prisma/client/runtime/client").Decimal;
            accountId: string;
            warehouseId: string | null;
            binId: string | null;
            batchNo: string | null;
            lotNo: string | null;
            expiryDate: Date | null;
            expiryDateBs: string | null;
            serialNumbers: string[];
            voucherId: string;
            id: string;
            companyId: string;
            createdAt: Date;
            taxCodeId: string | null;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        partyId: string | null;
        additionalNote: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
        fiscalSessionId: string | null;
    }) | null>;
    getById(user: AuthUser, id: string): Promise<{
        party: {
            name: string;
            id: string;
        } | null;
        lines: {
            itemId: string | null;
            qty: import("@prisma/client/runtime/client").Decimal;
            accountId: string;
            warehouseId: string | null;
            binId: string | null;
            batchNo: string | null;
            lotNo: string | null;
            expiryDate: Date | null;
            expiryDateBs: string | null;
            serialNumbers: string[];
            voucherId: string;
            id: string;
            companyId: string;
            createdAt: Date;
            taxCodeId: string | null;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        partyId: string | null;
        additionalNote: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
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
            party: {
                name: string;
                id: string;
                panNumber: string | null;
                vatNumber: string | null;
            } | null;
            stockLedger: {
                itemId: string;
                rate: import("@prisma/client/runtime/client").Decimal;
                id: string;
                qtyIn: import("@prisma/client/runtime/client").Decimal;
                qtyOut: import("@prisma/client/runtime/client").Decimal;
            }[];
            lines: ({
                party: {
                    name: string;
                    id: string;
                } | null;
                item: {
                    name: string;
                    id: string;
                    sku: string | null;
                } | null;
                account: {
                    code: string;
                    name: string;
                    id: string;
                };
            } & {
                itemId: string | null;
                qty: import("@prisma/client/runtime/client").Decimal;
                accountId: string;
                warehouseId: string | null;
                binId: string | null;
                batchNo: string | null;
                lotNo: string | null;
                expiryDate: Date | null;
                expiryDateBs: string | null;
                serialNumbers: string[];
                voucherId: string;
                id: string;
                companyId: string;
                createdAt: Date;
                taxCodeId: string | null;
                partyId: string | null;
                lineNo: number;
                description: string | null;
                debit: import("@prisma/client/runtime/client").Decimal;
                credit: import("@prisma/client/runtime/client").Decimal;
                taxAmount: import("@prisma/client/runtime/client").Decimal;
            })[];
        } & {
            memo: string | null;
            status: import("@prisma/client").$Enums.VoucherStatus;
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            voucherType: import("@prisma/client").$Enums.VoucherType;
            voucherNumber: string | null;
            referenceNo: string | null;
            voucherDate: Date;
            voucherDateBs: string | null;
            vendorInvoiceNo: string | null;
            vendorInvoiceDate: Date | null;
            partyId: string | null;
            additionalNote: string | null;
            source: string;
            createdByUserId: string | null;
            postedByUserId: string | null;
            voidedByUserId: string | null;
            postedAt: Date | null;
            voidedAt: Date | null;
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
            email: string;
            name: string | null;
            id: string;
        } | null;
    } & {
        voucherId: string;
        id: string;
        companyId: string;
        createdAt: Date;
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
        voucherId: string;
        id: string;
        companyId: string;
        createdAt: Date;
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
            itemId: string | null;
            qty: import("@prisma/client/runtime/client").Decimal;
            accountId: string;
            warehouseId: string | null;
            binId: string | null;
            batchNo: string | null;
            lotNo: string | null;
            expiryDate: Date | null;
            expiryDateBs: string | null;
            serialNumbers: string[];
            voucherId: string;
            id: string;
            companyId: string;
            createdAt: Date;
            taxCodeId: string | null;
            partyId: string | null;
            lineNo: number;
            description: string | null;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        }[];
    } & {
        memo: string | null;
        status: import("@prisma/client").$Enums.VoucherStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        voucherType: import("@prisma/client").$Enums.VoucherType;
        voucherNumber: string | null;
        referenceNo: string | null;
        voucherDate: Date;
        voucherDateBs: string | null;
        vendorInvoiceNo: string | null;
        vendorInvoiceDate: Date | null;
        partyId: string | null;
        additionalNote: string | null;
        source: string;
        createdByUserId: string | null;
        postedByUserId: string | null;
        voidedByUserId: string | null;
        postedAt: Date | null;
        voidedAt: Date | null;
        reversalOfVoucherId: string | null;
        revisionOfVoucherId: string | null;
        fiscalSessionId: string | null;
    })>;
    void(user: AuthUser, id: string, idempotencyKey?: string): Promise<import("@prisma/client/runtime/client").JsonValue | {
        voidedVoucherId: string;
        reversalVoucherId: string;
    }>;
}
