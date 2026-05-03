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

export async function updateUnit(id: string, input: { name: string }) {
  return apiRequest<UnitRecord>({
    method: "PATCH",
    path: `/units/${id}`,
    body: input,
  });
}

export async function deleteUnit(id: string) {
  return apiRequest<void>({
    method: "DELETE",
    path: `/units/${id}`,
  });
}

export async function reorderUnits(items: { id: string; sortOrder: number }[]) {
  return apiRequest<void>({
    method: "PATCH",
    path: "/units/reorder",
    body: items,
  });
}
