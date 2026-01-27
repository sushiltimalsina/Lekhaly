import type { AuthUser } from "../../common/auth/auth.types";
import { TaxesService } from "./taxes.service";
export declare class TaxesController {
    private taxes;
    constructor(taxes: TaxesService);
    list(user: AuthUser, query: any): Promise<{
        name: string;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        isActive: boolean;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(user: AuthUser, body: any): Promise<{
        name: string;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        isActive: boolean;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    get(user: AuthUser, id: string): Promise<{
        name: string;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        isActive: boolean;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthUser, id: string, body: any): Promise<{
        name: string;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        isActive: boolean;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        name: string;
        rate: import("@prisma/client/runtime/client").Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
        isActive: boolean;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
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
