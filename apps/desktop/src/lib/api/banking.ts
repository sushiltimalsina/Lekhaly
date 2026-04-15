// apps/desktop/src/lib/api/banking.ts
import { apiRequest } from "./client";

export type BankAccountInput = {
  accountId: string;
  bankName?: string;
  accountNumber?: string;
};

export type BankStatementInput = {
  bankAccountId: string;
  periodFrom?: string;
  periodFromBs?: string;
  periodTo?: string;
  periodToBs?: string;
  openingBalance: number;
  closingBalance: number;
};

export async function createBankAccount(input: BankAccountInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/banking/accounts",
    body: input,
  });
}

export async function createStatement(input: BankStatementInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/banking/statements",
    body: input,
  });
}

export async function listStatements(params?: { skip?: number; take?: number }) {
  return apiRequest<any>({
    method: "GET",
    path: "/banking/statements",
    query: params,
  });
}

export async function getStatement(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/banking/statements/${id}`,
  });
}

export async function reconcile(input: any) {
  return apiRequest<any>({
    method: "POST",
    path: "/banking/reconcile",
    body: input,
  });
}

export async function getBankSyncStatus() {
  return apiRequest<any>({
    method: "GET",
    path: "/banking/sync/status",
  });
}
