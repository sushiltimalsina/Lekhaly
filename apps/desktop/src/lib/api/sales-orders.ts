// apps/desktop/src/lib/api/sales-orders.ts
import { apiRequest } from "./client";

export type SalesOrderStatus = "draft" | "open" | "fulfilled" | "cancelled";

export type SalesOrderItemInput = {
    itemId: string;
    description?: string;
    qty: number;
    rate: number;
    taxCodeId?: string;
};

export type SalesOrderRecord = {
    id: string;
    orderNo?: string;
    partyId: string;
    partyName?: string;
    orderDate?: string;
    orderDateBs?: string;
    expectedDelivery?: string;
    expectedDeliveryBs?: string;
    customerPoRef?: string;
    salesType?: string;
    status: SalesOrderStatus;
    memo?: string;
    notes?: string;
    terms?: string;
    total: number;
    fulfilledAmount?: number;
    items: Array<{
        id: string;
        itemId: string;
        itemName?: string;
        qty: number;
        rate: number;
        amount: number;
        description?: string;
    }>;
    sundries?: Array<{
        id: string;
        billSundryId?: string;
        name: string;
        type: "add" | "less";
        rate?: number;
        amount: number;
    }>;
    createdAt?: string;
    updatedAt?: string;
};

export type SalesOrderInput = {
    partyId: string;
    orderDate?: string;
    orderDateBs?: string;
    expectedDelivery?: string;
    expectedDeliveryBs?: string;
    customerPoRef?: string;
    salesType?: "vat_13" | "exempt" | "export";
    memo?: string;
    notes?: string;
    terms?: string;
    items: SalesOrderItemInput[];
    sundries?: Array<{
        billSundryId?: string;
        name: string;
        type: "add" | "less";
        rate?: number | null;
        amount: number;
    }>;
};

export async function createSalesOrder(input: SalesOrderInput) {
    return apiRequest<SalesOrderRecord>({
        method: "POST",
        path: "/sales-orders",
        body: input,
    });
}

export async function updateSalesOrder(id: string, input: SalesOrderInput) {
    return apiRequest<SalesOrderRecord>({
        method: "PUT",
        path: `/sales-orders/${id}`,
        body: input,
    });
}

export async function getSalesOrder(id: string) {
    return apiRequest<SalesOrderRecord>({
        method: "GET",
        path: `/sales-orders/${id}`,
    });
}

export async function listSalesOrders(params?: {
    status?: SalesOrderStatus;
    q?: string;
    from?: Date | string;
    to?: Date | string;
    skip?: number;
    take?: number;
}) {
    return apiRequest<SalesOrderRecord[] | { items?: SalesOrderRecord[]; data?: SalesOrderRecord[]; meta: any }>({
        method: "GET",
        path: "/sales-orders",
        query: params as any,
    });
}

export async function cancelSalesOrder(id: string) {
    return apiRequest<any>({
        method: "POST",
        path: `/sales-orders/${id}/cancel`,
    });
}

export async function convertToInvoice(id: string) {
    return apiRequest<any>({
        method: "POST",
        path: `/sales-orders/${id}/convert-to-invoice`,
    });
}
