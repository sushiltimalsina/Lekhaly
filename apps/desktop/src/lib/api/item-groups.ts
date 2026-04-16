// apps/desktop/src/lib/api/item-groups.ts
import { apiRequest } from "./client";

export type ItemGroupRecord = {
  id: string;
  name: string;
};

export async function listItemGroups(params?: { q?: string; skip?: number; take?: number }) {
  return apiRequest<ItemGroupRecord[]>({
    method: "GET",
    path: "/item-groups",
    query: params,
  });
}

export async function createItemGroup(input: { name: string }) {
  return apiRequest<ItemGroupRecord>({
    method: "POST",
    path: "/item-groups",
    body: input,
  });
}

export async function deleteItemGroup(id: string) {
  return apiRequest<void>({
    method: "DELETE",
    path: `/item-groups/${id}`,
  });
}
