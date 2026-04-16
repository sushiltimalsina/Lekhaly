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

export type BankStatementLineInput = {
  date?: string;
  dateBs?: string;
  description?: string;
  amount: number;
  debitCredit: "debit" | "credit";
};

export type ReconcileInput = {
  statementLineId: string;
  voucherId: string;
  voucherLineId?: string;
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

export async function addStatementLine(statementId: string, input: BankStatementLineInput) {
  return apiRequest<any>({
    method: "POST",
    path: `/banking/statements/${statementId}/lines`,
    body: input,
  });
}

export async function reconcile(input: ReconcileInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/banking/reconcile",
    body: input,
  });
}

export async function unmatchReconcile(lineId: string) {
  return apiRequest<any>({
    method: "POST",
    path: `/banking/reconcile/${lineId}/unmatch`,
  });
}

/* Banking sync */
export async function connectBankSync() {
  return apiRequest<any>({
    method: "POST",
    path: "/banking/sync/connect",
  });
}

export async function getBankSyncStatus() {
  return apiRequest<any>({
    method: "GET",
    path: "/banking/sync/status",
  });
}

export async function refreshBankSync() {
  return apiRequest<any>({
    method: "POST",
    path: "/banking/sync/refresh",
  });
}
