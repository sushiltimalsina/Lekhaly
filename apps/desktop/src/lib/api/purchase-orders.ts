// apps/desktop/src/lib/api/purchase-orders.ts
import { apiRequest } from "./client";

export type PurchaseOrderStatus = "draft" | "open" | "fulfilled" | "cancelled";

export type PurchaseOrderRecord = {
    id: string;
    orderNo?: string;
    partyId: string;
    partyName?: string;
    orderDate?: string;
    orderDateBs?: string;
    expectedDelivery?: string;
    expectedDeliveryBs?: string;
    vendorRef?: string;
    purchaseType?: string;
    status: PurchaseOrderStatus;
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

export type PurchaseOrderItemInput = {
    itemId: string;
    description?: string;
    qty: number;
    rate: number;
    taxCodeId?: string;
};

export type PurchaseOrderInput = {
    partyId: string;
    orderDate?: string;
    orderDateBs?: string;
    expectedDelivery?: string;
    expectedDeliveryBs?: string;
    vendorRef?: string;
    purchaseType?: "vat_13" | "exempt" | "export";
    memo?: string;
    notes?: string;
    terms?: string;
    items: PurchaseOrderItemInput[];
    sundries?: Array<{
        billSundryId?: string;
        name: string;
        type: "add" | "less";
        rate?: number | null;
        amount: number;
    }>;
};

export async function createPurchaseOrder(input: PurchaseOrderInput) {
    return apiRequest<PurchaseOrderRecord>({
        method: "POST",
        path: "/purchase-orders",
        body: input,
    });
}

export async function updatePurchaseOrder(id: string, input: PurchaseOrderInput) {
    return apiRequest<PurchaseOrderRecord>({
        method: "PUT",
        path: `/purchase-orders/${id}`,
        body: input,
    });
}

export async function getPurchaseOrder(id: string) {
    return apiRequest<PurchaseOrderRecord>({
        method: "GET",
        path: `/purchase-orders/${id}`,
    });
}

export async function listPurchaseOrders(params?: {
    status?: PurchaseOrderStatus;
    q?: string;
    from?: Date | string;
    to?: Date | string;
    skip?: number;
    take?: number;
}) {
    return apiRequest<PurchaseOrderRecord[] | { items?: PurchaseOrderRecord[]; data?: PurchaseOrderRecord[]; meta: any }>({
        method: "GET",
        path: "/purchase-orders",
        query: params as any,
    });
}

export async function cancelPurchaseOrder(id: string) {
    return apiRequest<any>({
        method: "POST",
        path: `/purchase-orders/${id}/cancel`,
    });
}

export async function convertToPurchase(id: string) {
    return apiRequest<any>({
        method: "POST",
        path: `/purchase-orders/${id}/convert-to-purchase`,
    });
}
