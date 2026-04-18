import type { AuthUser } from "../../common/auth/auth.types";
import { ExpensesService } from "./expenses.service";
export declare class ExpensesController {
    private expenses;
    constructor(expenses: ExpensesService);
    createDraft(user: AuthUser, body: any): Promise<{
        id: string;
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        voucherId: string | null;
        vendorId: string | null;
        taxCodeId: string | null;
        attachmentId: string | null;
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
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        voucherId: string | null;
        vendorId: string | null;
        taxCodeId: string | null;
        attachmentId: string | null;
    }>;
    list(user: AuthUser, query: any): Promise<{
        id: string;
        date: Date;
        dateBs: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        voucherId: string | null;
        vendorId: string | null;
        taxCodeId: string | null;
        attachmentId: string | null;
    }[]>;
}
