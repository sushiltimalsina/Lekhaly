import { apiRequest } from "./client";

export interface ActiveFiscalSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;

  invoicePrefix: string;
  invoiceSuffix: string | null;
  nextInvoiceNumber: number;

  purchasePrefix: string;
  purchaseSuffix: string | null;
  nextPurchaseNumber: number;

  salesReturnPrefix: string;
  salesReturnSuffix: string | null;
  nextSalesReturnNumber: number;

  purchaseReturnPrefix: string;
  purchaseReturnSuffix: string | null;
  nextPurchaseReturnNumber: number;

  receiptPrefix: string;
  receiptSuffix: string | null;
  nextReceiptNumber: number;

  paymentPrefix: string;
  paymentSuffix: string | null;
  nextPaymentNumber: number;

  journalPrefix: string;
  journalSuffix: string | null;
  nextJournalNumber: number;

  quotationPrefix: string;
  quotationSuffix: string | null;
  nextQuotationNumber: number;

  orderPrefix: string;
  orderSuffix: string | null;
  nextOrderNumber: number;

  purchaseOrderPrefix: string;
  purchaseOrderSuffix: string | null;
  nextPurchaseOrderNumber: number;

  contraPrefix?: string;
  contraSuffix?: string | null;
  nextContraNumber?: number;
}

export interface FiscalSessionRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  invoicePrefix: string;
  invoiceSuffix?: string;
}

export function formatVoucherNumber(
  prefix: string | null | undefined,
  seq: number | null | undefined,
  suffix: string | null | undefined
): string {
  const p = prefix || "";
  const s = suffix || "";
  const n = seq ?? 1;
  const formattedPrefix = p ? (p.endsWith("-") ? p : `${p}-`) : "";
  const formattedSuffix = s ? (s.startsWith("-") ? s : `-${s}`) : "";
  return `${formattedPrefix}${n}${formattedSuffix}`;
}

export async function getActiveFiscalSession(): Promise<ActiveFiscalSession | null> {
  try {
    return await apiRequest<ActiveFiscalSession>({ path: "/fiscal-sessions/active" });
  } catch {
    return null;
  }
}

export async function listFiscalSessions() {
  return apiRequest<FiscalSessionRecord[]>({ path: "/fiscal-sessions" });
}

export async function createFiscalSession(data: any) {
  return apiRequest<FiscalSessionRecord>({
    path: "/fiscal-sessions",
    method: "POST",
    body: data,
  });
}

export async function switchFiscalSession(id: string) {
  return apiRequest<{ success: boolean; activeFiscalSessionId: string }>({
    path: `/fiscal-sessions/${id}/switch`,
    method: "PUT",
  });
}

export async function lockFiscalSession(id: string, lock: boolean) {
  return apiRequest<FiscalSessionRecord>({
    path: `/fiscal-sessions/${id}/lock`,
    method: "PUT",
    body: { lock },
  });
}
