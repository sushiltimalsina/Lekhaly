// apps/web/src/lib/api/quotations.ts
import { apiRequest } from "./client";

export type QuotationStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type QuotationItemInput = {
    itemId: string;
    description?: string;
    qty: number;
    rate: number;
    taxCodeId?: string;
};

export type QuotationInput = {
    partyId: string;
    quotationDate?: string; // ISO
    quotationDateBs?: string; // BS string
    expiryDate?: string; // ISO
    expiryDateBs?: string; // BS string
    referenceNo?: string;
    salesType?: "vat_13" | "exempt" | "export";
    memo?: string;
    notes?: string;
    terms?: string;
    items: QuotationItemInput[];
    sundries?: Array<{
        billSundryId?: string;
        name: string;
        type: "add" | "less";
        rate?: number | null;
        amount: number;
    }>;
};

export type QuotationRecord = {
    id: string;
    quotationNo: string;
    partyId: string;
    partyName?: string;
    quotationDate: string;
    quotationDateBs: string;
    expiryDate?: string;
    expiryDateBs?: string;
    status: QuotationStatus;
    total: number;
    memo?: string;
    createdAt: string;
    updatedAt: string;
};

export async function createQuotation(input: QuotationInput) {
    return apiRequest<any>({
        method: "POST",
        path: "/quotations",
        body: input,
    });
}

export async function updateQuotation(id: string, input: QuotationInput) {
    return apiRequest<any>({
        method: "PUT",
        path: `/quotations/${id}`,
        body: input,
    });
}

export async function getQuotation(id: string) {
    return apiRequest<any>({
        method: "GET",
        path: `/quotations/${id}`,
    });
}

export async function listQuotations(params?: {
    status?: QuotationStatus;
    q?: string;
    from?: Date | string;
    to?: Date | string;
    skip?: number;
    take?: number;
}) {
    return apiRequest<any>({
        method: "GET",
        path: "/quotations",
        query: params as any,
    });
}

export async function acceptQuotation(id: string) {
    return apiRequest<any>({
        method: "POST",
        path: `/quotations/${id}/accept`,
    });
}

export async function declineQuotation(id: string) {
    return apiRequest<any>({
        method: "POST",
        path: `/quotations/${id}/decline`,
    });
}

export async function convertToSalesOrder(id: string) {
    return apiRequest<any>({
        method: "POST",
        path: `/quotations/${id}/convert-to-sales-order`,
    });
}
