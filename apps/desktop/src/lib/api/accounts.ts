// apps/desktop/src/lib/api/accounts.ts
import { apiRequest } from "./client";

export type AccountRecord = {
  id: string;
  code?: string | null;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  isActive?: boolean;
  isPostable?: boolean;
  parentId?: string | null;
};

export async function listAccounts(params?: { type?: string; isActive?: boolean; q?: string; skip?: number; take?: number }) {
  return apiRequest<AccountRecord[]>({
    method: "GET",
    path: "/accounts",
    query: params,
  });
}
