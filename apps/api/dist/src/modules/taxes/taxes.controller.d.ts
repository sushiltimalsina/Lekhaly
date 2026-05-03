import type { AuthUser } from "../../common/auth/auth.types";
import { TaxesService } from "./taxes.service";
export declare class TaxesController {
    private taxes;
    constructor(taxes: TaxesService);
    list(user: AuthUser, query: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: import("@prisma/client/runtime/client").Decimal;
        sortOrder: number;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }[]>;
    reorder(user: AuthUser, body: any): Promise<{
        success: boolean;
    }>;
    create(user: AuthUser, body: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: import("@prisma/client/runtime/client").Decimal;
        sortOrder: number;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: import("@prisma/client/runtime/client").Decimal;
        sortOrder: number;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: import("@prisma/client/runtime/client").Decimal;
        sortOrder: number;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: import("@prisma/client/runtime/client").Decimal;
        sortOrder: number;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }>;
    vatReport(user: AuthUser, query: any): Promise<{
        rows: {
            voucherId: string;
            date: Date;
            partyId: string | null;
            taxableAmount: import("@prisma/client/runtime/client").Decimal;
            vatAmount: import("@prisma/client/runtime/client").Decimal;
            type: string;
            taxCodeId: string | null;
        }[];
    }>;
    vatSummary(user: AuthUser, query: any): Promise<{
        totalSalesVat: import("@prisma/client/runtime/client").Decimal;
        totalPurchaseVat: import("@prisma/client/runtime/client").Decimal;
        netVat: import("@prisma/client/runtime/client").Decimal;
    }>;
}
