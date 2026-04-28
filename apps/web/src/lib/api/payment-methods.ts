import { apiClient } from "./client";

export async function listPaymentMethods(params: { isActive?: boolean; take?: number } = {}) {
  return apiClient.get("/payment-methods", { params });
}

export async function createPaymentMethod(data: { name: string; isActive?: boolean }) {
  return apiClient.post("/payment-methods", data);
}

export async function updatePaymentMethod(id: string, data: { name?: string; isActive?: boolean }) {
  return apiClient.patch(`/payment-methods/${id}`, data);
}

export async function deletePaymentMethod(id: string) {
  return apiClient.delete(`/payment-methods/${id}`);
}
