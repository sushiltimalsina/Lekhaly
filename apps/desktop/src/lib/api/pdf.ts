// apps/desktop/src/lib/api/pdf.ts
import { apiRequest } from "./client";

export async function generateInvoicePdf(invoiceId: string) {
  return apiRequest<any>({
    method: "POST",
    path: `/pdf/invoice/${invoiceId}`,
  });
}

export async function generateVoucherPdf(voucherId: string) {
  return apiRequest<any>({
    method: "POST",
    path: `/pdf/voucher/${voucherId}`,
  });
}

export async function generateLedgerPdf(body: Record<string, any>) {
  return apiRequest<any>({
    method: "POST",
    path: `/pdf/ledger`,
    body,
  });
}

export async function getPdfJob(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/pdf/jobs/${id}`,
  });
}

export async function getPdfJobUrl(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/pdf/jobs/${id}/url`,
  });
}
