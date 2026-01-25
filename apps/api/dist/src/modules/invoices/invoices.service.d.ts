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
        items: Array<{
            itemId?: string;
            description?: string;
            qty: number;
            rate: number;
            taxCodeId?: string;
            taxCodeIds?: string[];
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
        date: Date;
        dateBs: string | undefined;
        dueDate: Date | undefined;
        dueDateBs: string | undefined;
    }>;
    createDraft(user: AuthUser, input: {
        type: "sales" | "sales_return";
        partyId: string;
        date?: Date;
        dateBs?: string;
        dueDate?: Date;
        dueDateBs?: string;
        receivableAccountId: string;
        items: Array<{
            itemId?: string;
            description?: string;
            qty: number;
            rate: number;
            taxCodeId?: string;
            taxCodeIds?: string[];
        }>;
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            rate: Prisma.Decimal;
            itemId: string | null;
            taxCodeId: string | null;
            description: string | null;
            qty: Prisma.Decimal;
            amount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
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
                    rate: Prisma.Decimal;
                    isInclusive: boolean;
                    inputTaxAccountId: string | null;
                    outputTaxAccountId: string | null;
                };
            } & {
                id: string;
                taxCodeId: string;
                taxAmount: Prisma.Decimal;
                invoiceItemId: string;
            })[];
            id: string;
            createdAt: Date;
            rate: Prisma.Decimal;
            itemId: string | null;
            taxCodeId: string | null;
            description: string | null;
            qty: Prisma.Decimal;
            amount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
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
