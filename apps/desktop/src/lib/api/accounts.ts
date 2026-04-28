// apps/web/src/lib/api/accounts.ts

import { apiRequest } from "./client";

export type AccountRecord = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  isActive?: boolean;
  isPostable?: boolean;
  isGroup?: boolean;
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

