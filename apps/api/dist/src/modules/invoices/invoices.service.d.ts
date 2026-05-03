import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class InvoicesService {
    private prisma;
    constructor(prisma: PrismaService);
    private getCompany;
    private getInventorySettings;
    private validateItems;
    private computeTotals;
    private enforceStockForSales;
    preview(user: AuthUser, input: {
        type: "sales" | "sales_return";
        partyId: string;
        date?: Date;
        dateBs?: string;
        dueDate?: Date;
        dueDateBs?: string;
        receivableAccountId: string;
        referenceNo?: string;
        items: Array<{
            itemId?: string;
            description?: string;
            qty: number;
            rate: number;
            taxCodeId?: string;
            taxCodeIds?: string[];
        }>;
        sundries?: Array<{
            billSundryId?: string;
            name: string;
            type: "add" | "less";
            rate?: number | null;
            amount: number;
        }>;
        memo?: string;
        additionalNote?: string;
        paymentMethodId?: string;
        saleTypeId?: string;
    }): Promise<{
        totals: {
            subtotal: Prisma.Decimal;
            vatAmount: Prisma.Decimal;
            total: Prisma.Decimal;
        };
        voucherType: "sales_invoice" | "sales_return";
        voucherLines: {
            accountId: string;
            partyId?: string;
            debit: Prisma.Decimal;
            credit: Prisma.Decimal;
            description?: string;
            taxCodeId?: string;
            taxAmount?: Prisma.Decimal;
        }[];
        receivableAccountId: string;
        items: {
            amount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            taxCodeId: string | undefined;
            taxBreakdown: {
                taxCodeId: string;
                taxAmount: Prisma.Decimal;
            }[];
            itemId?: string;
            description?: string;
            qty: number;
            rate: number;
            taxCodeIds?: string[];
        }[];
        sundries: {
            amount: Prisma.Decimal;
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
        memo: string | undefined;
        additionalNote: string | undefined;
        paymentMethodId: string | undefined;
        saleTypeId: string | undefined;
    }>;
    createDraft(user: AuthUser, input: {
        type: "sales" | "sales_return";
        partyId: string;
        date?: Date;
        dateBs?: string;
        dueDate?: Date;
        dueDateBs?: string;
        receivableAccountId: string;
        referenceNo?: string;
        items: Array<{
            itemId?: string;
            description?: string;
            qty: number;
            rate: number;
            taxCodeId?: string;
            taxCodeIds?: string[];
        }>;
        sundries?: Array<{
            billSundryId?: string;
            name: string;
            type: "add" | "less";
            rate?: number | null;
            amount: number;
        }>;
        memo?: string;
        additionalNote?: string;
        paymentMethodId?: string;
        saleTypeId?: string;
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            description: string | null;
            qty: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            itemId: string | null;
            taxCodeId: string | null;
            amount: Prisma.Decimal;
            rate: Prisma.Decimal;
            landedCostAmount: Prisma.Decimal | null;
            invoiceId: string;
        }[];
        sundries: {
            id: string;
            name: string;
            createdAt: Date;
            type: string;
            accountId: string | null;
            amount: Prisma.Decimal;
            rate: Prisma.Decimal | null;
            billSundryId: string | null;
            invoiceId: string;
        }[];
    } & {
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        referenceNo: string | null;
        memo: string | null;
        additionalNote: string | null;
        partyId: string;
        voucherId: string | null;
        invoiceNo: string | null;
        type: string;
        receivableAccountId: string;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethodId: string | null;
        saleTypeId: string | null;
    }>;
    post(user: AuthUser, invoiceId: string): Promise<{
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        referenceNo: string | null;
        memo: string | null;
        additionalNote: string | null;
        partyId: string;
        voucherId: string | null;
        invoiceNo: string | null;
        type: string;
        receivableAccountId: string;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethodId: string | null;
        saleTypeId: string | null;
    }>;
    void(user: AuthUser, invoiceId: string): Promise<{
        success: boolean;
    }>;
    list(user: AuthUser, filters: {
        type?: string;
        status?: string;
        q?: string;
        from?: Date;
        to?: Date;
        skip?: number;
        take?: number;
    }): Promise<({
        items: ({
            item: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            description: string | null;
            qty: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            itemId: string | null;
            taxCodeId: string | null;
            amount: Prisma.Decimal;
            rate: Prisma.Decimal;
            landedCostAmount: Prisma.Decimal | null;
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
            additionalNote: string | null;
            postedAt: Date | null;
        } | null;
    } & {
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        referenceNo: string | null;
        memo: string | null;
        additionalNote: string | null;
        partyId: string;
        voucherId: string | null;
        invoiceNo: string | null;
        type: string;
        receivableAccountId: string;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethodId: string | null;
        saleTypeId: string | null;
    })[]>;
    getById(user: AuthUser, invoiceId: string): Promise<{
        items: any[];
        sundries: {
            id: string;
            name: string;
            createdAt: Date;
            type: string;
            accountId: string | null;
            amount: Prisma.Decimal;
            rate: Prisma.Decimal | null;
            billSundryId: string | null;
            invoiceId: string;
        }[];
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        referenceNo: string | null;
        memo: string | null;
        additionalNote: string | null;
        partyId: string;
        voucherId: string | null;
        invoiceNo: string | null;
        type: string;
        receivableAccountId: string;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethodId: string | null;
        saleTypeId: string | null;
    }>;
    updateDraft(user: AuthUser, id: string, input: {
        type: "sales" | "sales_return";
        partyId: string;
        date?: Date;
        dateBs?: string;
        dueDate?: Date;
        dueDateBs?: string;
        receivableAccountId: string;
        referenceNo?: string;
        items: Array<{
            itemId?: string;
            description?: string;
            qty: number;
            rate: number;
            taxCodeId?: string;
            taxCodeIds?: string[];
        }>;
        sundries?: Array<{
            billSundryId?: string;
            name: string;
            type: "add" | "less";
            rate?: number | null;
            amount: number;
        }>;
        memo?: string;
        additionalNote?: string;
        paymentMethodId?: string;
        saleTypeId?: string;
    }): Promise<{
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        referenceNo: string | null;
        memo: string | null;
        additionalNote: string | null;
        partyId: string;
        voucherId: string | null;
        invoiceNo: string | null;
        type: string;
        receivableAccountId: string;
        date: Date;
        dateBs: string | null;
        dueDate: Date | null;
        dueDateBs: string | null;
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethodId: string | null;
        saleTypeId: string | null;
    }>;
}
