import { apiRequest } from "./client";

export interface FiscalSessionRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  invoicePrefix: string;
  invoiceSuffix?: string;
  // ... other fields if needed, but these are core for listing
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
