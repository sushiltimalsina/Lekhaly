// apps/web/src/lib/api/accounts.ts

import { apiRequest } from "./client";

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export type AccountTypeOption = { value: AccountType; label: string };

export const FALLBACK_ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  { value: "asset", label: "Assets" },
  { value: "liability", label: "Liabilities" },
  { value: "equity", label: "Equity" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expenses" },
];

export type AccountRecord = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isActive?: boolean;
  isPostable?: boolean;
  isGroup?: boolean;
  isContra?: boolean;
  level?: number;
  parentId?: string | null;
  direct_balance?: number;
  total_balance?: number;
};

export async function listAccounts(params?: { type?: string; isActive?: boolean; q?: string; skip?: number; take?: number }) {
  return apiRequest<AccountRecord[]>({
    method: "GET",
    path: "/accounts",
    query: params,
  });
}

export async function getAccountSummary() {
  return apiRequest<AccountRecord[]>({
    method: "GET",
    path: "/accounts/tree/summary",
  });
}

export async function getAccountTypes() {
  return apiRequest<AccountTypeOption[]>({
    method: "GET",
    path: "/accounts/types",
  });
}

