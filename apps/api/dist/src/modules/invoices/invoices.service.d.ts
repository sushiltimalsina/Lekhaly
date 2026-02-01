import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class InvoicesService {
    private prisma;
    constructor(prisma: PrismaService);
    private getCompany;
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
    }): Promise<{
        totals: {
            subtotal: Prisma.Decimal;
            vatAmount: Prisma.Decimal;
            total: Prisma.Decimal;
        };
        voucherType: "sales_return" | "sales_invoice";
        voucherLines: {
            accountId: string;
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
    }): Promise<{
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
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }>;
    post(user: AuthUser, invoiceId: string): Promise<{
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
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }>;
    void(user: AuthUser, invoiceId: string): Promise<{
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
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }>;
    list(user: AuthUser, filters: {
        type?: string;
        status?: string;
        from?: Date;
        to?: Date;
        skip?: number;
        take?: number;
    }): Promise<{
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
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }[]>;
    getById(user: AuthUser, invoiceId: string): Promise<{
        items: any[];
        sundries: {
            id: string;
            name: string;
            type: string;
            createdAt: Date;
            rate: Prisma.Decimal | null;
            accountId: string | null;
            amount: Prisma.Decimal;
            billSundryId: string | null;
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
        subtotal: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        total: Prisma.Decimal;
        status: string;
        voucherId: string | null;
        partyId: string;
        receivableAccountId: string;
    }>;
}
