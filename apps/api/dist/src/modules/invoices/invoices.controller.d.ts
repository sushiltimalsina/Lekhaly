import type { AuthUser } from "../../common/auth/auth.types";
import { InvoicesService } from "./invoices.service";
export declare class InvoicesController {
    private invoices;
    constructor(invoices: InvoicesService);
    createDraft(user: AuthUser, body: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            description: string | null;
            rate: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            itemId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            amount: import("@prisma/client/runtime/client").Decimal;
            invoiceId: string;
        }[];
        sundries: {
            id: string;
            name: string;
            createdAt: Date;
            type: string;
            rate: import("@prisma/client/runtime/client").Decimal | null;
            accountId: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            billSundryId: string | null;
            invoiceId: string;
        }[];
    } & {
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        referenceNo: string | null;
        partyId: string;
        voucherId: string | null;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        receivableAccountId: string;
        invoiceNo: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
    }>;
    preview(user: AuthUser, body: any): Promise<{
        totals: {
            subtotal: import("@prisma/client/runtime/client").Decimal;
            vatAmount: import("@prisma/client/runtime/client").Decimal;
            total: import("@prisma/client/runtime/client").Decimal;
        };
        voucherType: "sales_invoice" | "sales_return";
        voucherLines: {
            accountId: string;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            description?: string;
            taxCodeId?: string;
            taxAmount?: import("@prisma/client/runtime/client").Decimal;
        }[];
        receivableAccountId: string;
        items: {
            amount: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | undefined;
            taxBreakdown: {
                taxCodeId: string;
                taxAmount: import("@prisma/client/runtime/client").Decimal;
            }[];
            itemId?: string;
            description?: string;
            qty: number;
            rate: number;
            taxCodeIds?: string[];
        }[];
        sundries: {
            amount: import("@prisma/client/runtime/client").Decimal;
            accountId: string | undefined;
            billSundryId?: string;
            name: string;
            type: "add" | "less";
            rate?: number | null;
        }[];
        date: Date;
        dateBs: string | undefined;
        dueDate: Date | undefined;
        dueDateBs: string | undefined;
        referenceNo: string | undefined;
    }>;
    post(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        referenceNo: string | null;
        partyId: string;
        voucherId: string | null;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        receivableAccountId: string;
        invoiceNo: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
    }>;
    void(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        referenceNo: string | null;
        partyId: string;
        voucherId: string | null;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        receivableAccountId: string;
        invoiceNo: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
    }>;
    list(user: AuthUser, query: any): Promise<({
        items: ({
            item: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            description: string | null;
            rate: import("@prisma/client/runtime/client").Decimal;
            taxCodeId: string | null;
            itemId: string | null;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            qty: import("@prisma/client/runtime/client").Decimal;
            amount: import("@prisma/client/runtime/client").Decimal;
            invoiceId: string;
        })[];
        party: {
            id: string;
            name: string;
            panNumber: string | null;
            vatNumber: string | null;
        };
        voucher: {
            referenceNo: string | null;
            memo: string | null;
        } | null;
    } & {
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        referenceNo: string | null;
        partyId: string;
        voucherId: string | null;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        receivableAccountId: string;
        invoiceNo: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
    })[]>;
    getById(user: AuthUser, id: string): Promise<{
        items: any[];
        sundries: {
            id: string;
            name: string;
            createdAt: Date;
            type: string;
            rate: import("@prisma/client/runtime/client").Decimal | null;
            accountId: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            billSundryId: string | null;
            invoiceId: string;
        }[];
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        referenceNo: string | null;
        partyId: string;
        voucherId: string | null;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        receivableAccountId: string;
        invoiceNo: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
    }>;
}
