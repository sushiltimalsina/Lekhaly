import type { AuthUser } from "../../common/auth/auth.types";
import { PdfService } from "./pdf.service";
export declare class PdfController {
    private pdf;
    constructor(pdf: PdfService);
    createInvoiceJob(user: AuthUser, invoiceId: string): Promise<{
        error: string | null;
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.PdfJobStatus;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        resultKey: string | null;
    }>;
    createVoucherJob(user: AuthUser, voucherId: string): Promise<{
        error: string | null;
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.PdfJobStatus;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        resultKey: string | null;
    }>;
    createLedgerJob(user: AuthUser, body: any): Promise<{
        error: string | null;
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.PdfJobStatus;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        resultKey: string | null;
    }>;
    getJob(user: AuthUser, id: string): Promise<{
        error: string | null;
        id: string;
        companyId: string;
        status: import("@prisma/client").$Enums.PdfJobStatus;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        resultKey: string | null;
    }>;
    getJobUrl(user: AuthUser, id: string): Promise<{
        jobId: string;
        url: string;
        expiresAt: Date;
    }>;
}
