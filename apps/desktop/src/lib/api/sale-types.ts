import { apiClient } from "./client";

export async function listSaleTypes(params: { isActive?: boolean; take?: number } = {}) {
  return apiClient.get("/sale-types", { params });
}

export async function createSaleType(data: { name: string; isActive?: boolean }) {
  return apiClient.post("/sale-types", data);
}

export async function updateSaleType(id: string, data: { name?: string; isActive?: boolean }) {
  return apiClient.patch(`/sale-types/${id}`, data);
}

export async function deleteSaleType(id: string) {
  return apiClient.delete(`/sale-types/${id}`);
}
