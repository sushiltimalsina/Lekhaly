// apps/web/src/lib/api/sales-orders.ts
import { apiRequest } from "./client";

export type SalesOrderStatus = "draft" | "open" | "fulfilled" | "cancelled";

export type SalesOrderItemInput = {
    itemId: string;
    description?: string;
    qty: number;
    rate: number;
    taxCodeId?: string;
};

export type SalesOrderInput = {
    partyId: string;
    orderDate?: string; // ISO
    orderDateBs?: string; // BS string
    expectedDelivery?: string; // ISO
    expectedDeliveryBs?: string; // BS string
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

export type SalesOrderLine = {
    id: string;
    itemId?: string;
    item?: { id: string; name?: string; unit?: string } | null;
    description?: string;
    qty: number;
    rate: number;
    amount: number;
    fulfilledQty?: number;
    taxCodeId?: string;
    taxAmount?: number;
};

export type SalesOrderParty = {
    id: string;
    name?: string;
};

export type SalesOrderRecord = {
    id: string;
    orderNo: string;
    partyId: string;
    partyName?: string;
    party?: SalesOrderParty | null;
    orderDate: string;
    orderDateBs: string;
    expectedDelivery?: string;
    expectedDeliveryBs?: string;
    customerPoRef?: string;
    status: SalesOrderStatus;
    total: number;
    fulfilledAmount?: number;
    memo?: string;
    createdAt: string;
    updatedAt: string;
    items?: SalesOrderLine[];
};

export async function createSalesOrder(input: SalesOrderInput) {
    return apiRequest<any>({
        method: "POST",
        path: "/sales-orders",
        body: input,
    });
}

export async function updateSalesOrder(id: string, input: SalesOrderInput) {
    return apiRequest<any>({
        method: "PUT",
        path: `/sales-orders/${id}`,
        body: input,
    });
}

export async function getSalesOrder(id: string) {
    return apiRequest<any>({
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
    return apiRequest<any>({
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
