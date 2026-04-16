// apps/desktop/src/lib/api/units.ts
import { apiRequest } from "./client";

export type UnitRecord = {
  id: string;
  name: string;
};

export async function listUnits(params?: { q?: string; skip?: number; take?: number }) {
  return apiRequest<UnitRecord[]>({
    method: "GET",
    path: "/units",
    query: params,
  });
}

export async function createUnit(input: { name: string }) {
  return apiRequest<UnitRecord>({
    method: "POST",
    path: "/units",
    body: input,
  });
}

export async function deleteUnit(id: string) {
  return apiRequest<void>({
    method: "DELETE",
    path: `/units/${id}`,
  });
}
