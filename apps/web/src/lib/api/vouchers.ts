// apps/web/src/lib/api/vouchers.ts
import { apiRequest } from "./client";

export type VoucherType =
  | "sales_invoice"
  | "sales_return"
  | "purchase"
  | "purchase_return"
  | "receipt"
  | "payment"
  | "journal"
  | "opening"
  | "reversal";

export type VoucherRecord = {
  id: string;
  voucherNo: string;
  voucherType: VoucherType;
  voucherDate: string;
  voucherDateBs: string;
  partyId?: string;
  memo?: string;
  additionalNote?: string;
  amount: number;
  status: string;
};

export type VoucherLineInput = {
  accountId?: string;
  partyId?: string;
  itemId?: string;
  description?: string;
  debit?: number;
  credit?: number;
  taxCodeId?: string;
  taxAmount?: number;
};

export type VoucherDraftInput = {
  voucherType: VoucherType;
  voucherDate?: string; // ISO
  voucherDateBs?: string; // BS
  partyId?: string;
  memo?: string;
  additionalNote?: string;
  referenceNo?: string;
  vendorInvoiceNo?: string;
  vendorInvoiceDate?: string; // ISO
  lines: VoucherLineInput[];
};

export async function createVoucherDraft(input: VoucherDraftInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/vouchers/draft",
    body: input,
  });
}

export async function updateVoucherDraft(id: string, input: VoucherDraftInput) {
  return apiRequest<any>({
    method: "PUT",
    path: `/vouchers/${id}/draft`,
    body: input,
  });
}

export async function getVoucher(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/vouchers/${id}`,
  });
}

export async function listVouchers(params?: {
  type?: VoucherType;
  q?: string;
  status?: "draft" | "posted" | "void";
  from?: Date | string;
  to?: Date | string;
  skip?: number;
  take?: number
}) {
  const query: any = { ...params };
  if (query.type) {
    query.voucherType = query.type;
    delete query.type;
  }
  return apiRequest<any>({
    method: "GET",
    path: "/vouchers",
    query,
  });
}

export async function previewVoucher(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/vouchers/${id}/preview`,
  });
}

export async function postVoucher(id: string) {
  return apiRequest<any>({
    method: "POST",
    path: `/vouchers/${id}/post`,
  });
}

export async function voidVoucher(id: string) {
  return apiRequest<any>({
    method: "POST",
    path: `/vouchers/${id}/void`,
  });
}

/* Attachments */
export async function listVoucherAttachments(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/vouchers/${id}/attachments`,
  });
}

export async function addVoucherAttachment(id: string, body: Record<string, unknown>) {
  return apiRequest<any>({
    method: "POST",
    path: `/vouchers/${id}/attachments`,
    body,
  });
}

export async function deleteVoucherAttachment(id: string, attachmentId: string) {
  return apiRequest<any>({
    method: "DELETE",
    path: `/vouchers/${id}/attachments/${attachmentId}`,
  });
}

export async function getVoucherAttachmentUrl(id: string, attachmentId: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/vouchers/${id}/attachments/${attachmentId}/url`,
  });
}
