import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
export declare class TaxesService {
    private prisma;
    constructor(prisma: PrismaService);
    list(user: AuthUser, filters: {
        isActive?: boolean;
        q?: string;
    }): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: Prisma.Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }[]>;
    get(user: AuthUser, id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: Prisma.Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }>;
    create(user: AuthUser, input: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: Prisma.Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }>;
    update(user: AuthUser, id: string, input: any): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        rate: Prisma.Decimal;
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
        rate: Prisma.Decimal;
        isInclusive: boolean;
        inputTaxAccountId: string | null;
        outputTaxAccountId: string | null;
    }>;
    buildVatRegister(companyId: string, from?: Date, to?: Date): Promise<{
        voucherId: string;
        date: Date;
        partyId: string | null;
        taxableAmount: Prisma.Decimal;
        vatAmount: Prisma.Decimal;
        type: string;
        taxCodeId: string | null;
    }[]>;
    vatReport(user: AuthUser, from?: Date, to?: Date, fromBs?: string, toBs?: string): Promise<{
        rows: {
            voucherId: string;
            date: Date;
            partyId: string | null;
            taxableAmount: Prisma.Decimal;
            vatAmount: Prisma.Decimal;
            type: string;
            taxCodeId: string | null;
        }[];
    }>;
    vatSummary(user: AuthUser, from?: Date, to?: Date, fromBs?: string, toBs?: string): Promise<{
        totalSalesVat: Prisma.Decimal;
        totalPurchaseVat: Prisma.Decimal;
        netVat: Prisma.Decimal;
    }>;
}
