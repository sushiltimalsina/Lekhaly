import type { AuthUser } from "../../common/auth/auth.types";
import { InvoicesService } from "./invoices.service";
export declare class InvoicesController {
    private invoices;
    constructor(invoices: InvoicesService);
    createDraft(user: AuthUser, body: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            rate: import("@prisma/client/runtime/client").Decimal;
            itemId: string | null;
            taxCodeId: string | null;
            description: string | null;
            qty: import("@prisma/client/runtime/client").Decimal;
            amount: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            invoiceId: string;
        }[];
    } & {
        id: string;
        companyId: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        invoiceNo: string | null;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }>;
    preview(user: AuthUser, body: any): Promise<{
        totals: {
            subtotal: import("@prisma/client/runtime/client").Decimal;
            vatAmount: import("@prisma/client/runtime/client").Decimal;
            total: import("@prisma/client/runtime/client").Decimal;
        };
        voucherType: "sales_return" | "sales_invoice";
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
        date: Date;
        dateBs: string | undefined;
        dueDate: Date | undefined;
        dueDateBs: string | undefined;
    }>;
    post(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        invoiceNo: string | null;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }>;
    void(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        invoiceNo: string | null;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        invoiceNo: string | null;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }[]>;
    getById(user: AuthUser, id: string): Promise<{
        items: {
            itemName: string | undefined;
            hsCode: string | undefined;
            taxBreakdown: any;
            item: {
                id: string;
                name: string;
                hsCode: string | null;
            } | null;
            taxes: ({
                taxCode: {
                    id: string;
                    companyId: string;
                    name: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    rate: import("@prisma/client/runtime/client").Decimal;
                    isInclusive: boolean;
                    inputTaxAccountId: string | null;
                    outputTaxAccountId: string | null;
                };
            } & {
                id: string;
                taxCodeId: string;
                taxAmount: import("@prisma/client/runtime/client").Decimal;
                invoiceItemId: string;
            })[];
            id: string;
            createdAt: Date;
            rate: import("@prisma/client/runtime/client").Decimal;
            itemId: string | null;
            taxCodeId: string | null;
            description: string | null;
            qty: import("@prisma/client/runtime/client").Decimal;
            amount: import("@prisma/client/runtime/client").Decimal;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
            invoiceId: string;
        }[];
        id: string;
        companyId: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        invoiceNo: string | null;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: import("@prisma/client/runtime/client").Decimal;
        vatAmount: import("@prisma/client/runtime/client").Decimal;
        total: import("@prisma/client/runtime/client").Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }>;
}
