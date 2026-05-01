// apps/web/src/lib/api/auth.ts
import { apiRequest } from "./client";

export type LoginInput = {
  companyCode: string;
  email: string;
  password: string;
  totpCode?: string;
  deviceId?: string;
  deviceLabel?: string;
  rememberDevice?: boolean;
};

export type RegisterInput = {
  companyCode: string;
  companyName: string;
  name: string;
  email: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export async function login(input: LoginInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/login",
    auth: false,
    body: input,
  });
}

export async function register(input: RegisterInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/register",
    auth: false,
    body: input,
  });
}

export async function refresh() {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/refresh",
    auth: false,
  });
}

export async function logout() {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/logout",
    auth: false,
  });
}

export async function getProfile() {
  return apiRequest<any>({
    method: "GET",
    path: "/auth/profile",
  });
}

export async function updateProfile(body: Record<string, unknown>) {
  return apiRequest<any>({
    method: "PATCH",
    path: "/auth/profile",
    body,
  });
}

export async function getCompany() {
  return apiRequest<any>({
    method: "GET",
    path: "/auth/company",
  });
}

export async function updateCompany(body: Record<string, unknown>) {
  return apiRequest<any>({
    method: "PATCH",
    path: "/auth/company",
    body,
  });
}

export async function updateNotifications(body: Record<string, unknown>) {
  return apiRequest<any>({
    method: "PATCH",
    path: "/auth/notifications",
    body,
  });
}

export async function openBillingPortal() {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/billing/portal",
  });
}

export async function totpSetup() {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/totp/setup",
  });
}

export async function totpEnable(body: { totpCode: string }) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/totp/enable",
    body,
  });
}

export async function stepUp(body: { totpCode: string }) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/step-up",
    body,
  });
}
