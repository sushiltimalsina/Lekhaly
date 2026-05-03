import { apiRequest } from "./client";

export type BillSundryRecord = {
    id: string;
    name: string;
    type: "add" | "less";
    rate: number | null;
    accountId: string | null;
    isActive: boolean;
    account?: { id: string; name: string };
};

export type BillSundryInput = {
    name: string;
    type: "add" | "less";
    rate?: number | null;
    accountId?: string | null;
    isActive?: boolean;
};

export async function listBillSundries(params?: { isActive?: boolean; q?: string; take?: number; skip?: number }) {
    return apiRequest<any>({
        method: "GET",
        path: "/bill-sundries",
        query: params,
    });
}

export async function createBillSundry(input: BillSundryInput) {
    return apiRequest<BillSundryRecord>({
        method: "POST",
        path: "/bill-sundries",
        body: input,
    });
}

export async function getBillSundry(id: string) {
    return apiRequest<BillSundryRecord>({
        method: "GET",
        path: `/bill-sundries/${id}`,
    });
}

export async function updateBillSundry(id: string, input: BillSundryInput) {
    return apiRequest<BillSundryRecord>({
        method: "PUT",
        path: `/bill-sundries/${id}`,
        body: input,
    });
}

export async function deleteBillSundry(id: string) {
  return apiRequest<void>({
    method: "DELETE",
    path: `/bill-sundries/${id}`,
  });
}

export async function reorderBillSundries(items: { id: string; sortOrder: number }[]) {
  return apiRequest<void>({
    method: "PATCH",
    path: "/bill-sundries/reorder",
    body: items,
  });
}
