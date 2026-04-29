import { apiClient } from "./client";

export async function listPurchaseTypes(params: { isActive?: boolean; take?: number } = {}) {
  return apiClient.get("/purchase-types", { params });
}

export async function createPurchaseType(data: { name: string; isActive?: boolean }) {
  return apiClient.post("/purchase-types", data);
}

export async function updatePurchaseType(id: string, data: { name?: string; isActive?: boolean }) {
  return apiClient.patch(`/purchase-types/${id}`, data);
}

export async function deletePurchaseType(id: string) {
  return apiClient.delete(`/purchase-types/${id}`);
}
