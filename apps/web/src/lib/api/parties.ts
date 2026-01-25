// apps/web/src/lib/api/parties.ts

import { apiRequest } from "./client";

export type PartyRecord = {
  id: string;
  name: string;
  type?: "customer" | "supplier" | "both";
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

export async function listParties(params?: { type?: string; q?: string; skip?: number; take?: number }) {
  const safeParams = params?.take && params.take > 100 ? { ...params, take: 100 } : params;
  return apiRequest<PartyRecord[]>({
    method: "GET",
    path: "/parties",
    query: safeParams,
  });
}
