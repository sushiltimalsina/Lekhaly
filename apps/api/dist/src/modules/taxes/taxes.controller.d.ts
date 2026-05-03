import type { AuthUser } from "../../common/auth/auth.types";
import { TaxesService } from "./taxes.service";
export declare class TaxesController {
    private taxes;
    constructor(taxes: TaxesService);
    list(user: AuthUser, query: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
    }[]>;
    create(user: AuthUser, body: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
    }>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
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
