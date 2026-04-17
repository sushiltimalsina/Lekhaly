// apps/web/src/lib/api/taxes.ts
import { apiRequest } from "./client";

export type TaxCodeInput = {
  name: string;
  rate: number;
  isInclusive?: boolean;
  inputTaxAccountId?: string;
  outputTaxAccountId?: string;
};

export async function listTaxes(params?: { skip?: number; take?: number }) {
  return apiRequest<any>({
    method: "GET",
    path: "/taxes",
    query: params,
  });
}

export async function createTax(input: TaxCodeInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/taxes",
    body: input,
  });
}

export async function getTax(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/taxes/${id}`,
  });
}

export async function updateTax(id: string, input: TaxCodeInput) {
  return apiRequest<any>({
    method: "PUT",
    path: `/taxes/${id}`,
    body: input,
  });
}

export async function deleteTax(id: string) {
  return apiRequest<any>({
    method: "DELETE",
    path: `/taxes/${id}`,
  });
}

export async function getVatReport(params?: Record<string, any>) {
  return apiRequest<any>({
    method: "GET",
    path: "/taxes/reports/vat",
    query: params,
  });
}

export async function getVatSummary(params?: Record<string, any>) {
  return apiRequest<any>({
    method: "GET",
    path: "/taxes/reports/vat/summary",
    query: params,
  });
}
