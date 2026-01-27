// apps/web/src/lib/api/invoices.ts
import { apiRequest } from "./client";

export type InvoiceItemInput = {
  itemId: string;
  description?: string;
  qty: number;
  rate: number;
  taxCodeId?: string;
  taxCodeIds?: string[];
};

export type InvoiceDraftInput = {
  type: "sales" | "sales_return";
  partyId: string;
  date?: string; // ISO
  dateBs?: string; // BS string
  dueDate?: string; // ISO
  dueDateBs?: string; // BS string
  receivableAccountId: string;
  items: InvoiceItemInput[];
  sundries?: Array<{
    billSundryId?: string;
    name: string;
    type: "add" | "less";
    rate?: number | null;
    amount: number;
  }>;
};

export async function createInvoiceDraft(input: InvoiceDraftInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/invoices/draft",
    body: input,
  });
}

export async function previewInvoice(input: InvoiceDraftInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/invoices/preview",
    body: input,
  });
}

export async function postInvoice(id: string) {
  return apiRequest<any>({
    method: "POST",
    path: `/invoices/${id}/post`,
  });
}

export async function voidInvoice(id: string) {
  return apiRequest<any>({
    method: "POST",
    path: `/invoices/${id}/void`,
  });
}

export async function listInvoices(params?: { skip?: number; take?: number }) {
  return apiRequest<any>({
    method: "GET",
    path: "/invoices",
    query: params,
  });
}

export async function getInvoice(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/invoices/${id}`,
  });
}
