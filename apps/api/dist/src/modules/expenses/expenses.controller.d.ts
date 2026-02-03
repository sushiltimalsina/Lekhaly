import type { AuthUser } from "../../common/auth/auth.types";
import { ExpensesService } from "./expenses.service";
export declare class ExpensesController {
    private expenses;
    constructor(expenses: ExpensesService);
    createDraft(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        taxCodeId: string | null;
        description: string | null;
        voucherId: string | null;
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        attachmentId: string | null;
        vendorId: string | null;
    }>;
    preview(user: AuthUser, body: any): Promise<{
        total: import("@prisma/client/runtime/client").Decimal;
        taxAmount: import("@prisma/client/runtime/client").Decimal;
        lines: ({
            accountId: string;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            description: string;
            taxCodeId?: undefined;
            taxAmount?: undefined;
        } | {
            accountId: string;
            debit: import("@prisma/client/runtime/client").Decimal;
            credit: import("@prisma/client/runtime/client").Decimal;
            description: string;
            taxCodeId: string | undefined;
            taxAmount: import("@prisma/client/runtime/client").Decimal;
        })[];
    }>;
    post(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        taxCodeId: string | null;
        description: string | null;
        voucherId: string | null;
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        attachmentId: string | null;
        vendorId: string | null;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        taxCodeId: string | null;
        description: string | null;
        voucherId: string | null;
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        attachmentId: string | null;
        vendorId: string | null;
    }[]>;
}
