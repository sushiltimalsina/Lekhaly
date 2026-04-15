// apps/desktop/src/lib/api/bill-sundries.ts - Bill Sundry master data management API
import { apiRequest } from "./client";

export type BillSundryRecord = {
    id: string;
    name: string;
    type: "add" | "less";
    rate: number | null;
    accountId: string | null;
    isActive: boolean;
};

export async function listBillSundries(params?: { isActive?: boolean; q?: string; take?: number; skip?: number }) {
    return apiRequest<any>({
        method: "GET",
        path: "/bill-sundries",
        query: params,
    });
}

export async function createBillSundry(body: any) {
    return apiRequest<any>({
        method: "POST",
        path: "/bill-sundries",
        body,
    });
}

export async function getBillSundry(id: string) {
    return apiRequest<any>({
        method: "GET",
        path: `/bill-sundries/${id}`,
    });
}

export async function updateBillSundry(id: string, body: any) {
    return apiRequest<any>({
        method: "PUT",
        path: `/bill-sundries/${id}`,
        body,
    });
}

export async function removeBillSundry(id: string) {
    return apiRequest<any>({
        method: "DELETE",
        path: `/bill-sundries/${id}`,
    });
}
