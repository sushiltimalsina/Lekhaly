// apps/web/src/lib/api/auth.ts
import { apiRequest, buildUrl } from "./client";
import { clearToken, getRefreshToken, setToken } from "../store/auth";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginTotpInput = {
  challengeToken: string;
  code: string;
  rememberDevice?: boolean;
};

export type RegisterInput = {
  companyName: string;
  name: string;
  email: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type GoogleAuthInput = {
  intent: "login" | "register";
};

const REMEMBERED_DEVICE_KEY = "lekhaly_remembered_device";

function getRememberedDeviceId() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(REMEMBERED_DEVICE_KEY) ?? undefined;
}

export async function login(input: LoginInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/login",
    auth: false,
    body: { ...input, deviceId: getRememberedDeviceId() },
  });
}

export async function completeTotpLogin(input: LoginTotpInput) {
  const result = await apiRequest<any>({
    method: "POST",
    path: "/auth/login/totp",
    auth: false,
    body: { ...input, deviceId: getRememberedDeviceId() },
  });

  if (typeof window !== "undefined") {
    if (input.rememberDevice && result?.deviceId) {
      window.localStorage.setItem(REMEMBERED_DEVICE_KEY, result.deviceId);
    } else if (!input.rememberDevice) {
      window.localStorage.removeItem(REMEMBERED_DEVICE_KEY);
    }
  }

  return result;
}

export async function register(input: RegisterInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/register",
    auth: false,
    body: input,
  });
}

export async function requestPasswordReset(email: string) {
  return apiRequest<{ ok: true; message: string; resetToken?: string; resetUrl?: string }>({
    method: "POST",
    path: "/auth/forgot-password",
    auth: false,
    body: { email },
  });
}

export async function resetPassword(input: { token: string; password: string }) {
  return apiRequest<{ ok: true; message: string }>({
    method: "POST",
    path: "/auth/reset-password",
    auth: false,
    body: input,
  });
}

export function startGoogleAuth(input: GoogleAuthInput) {
  if (typeof window === "undefined") return;
  const url = buildUrl("/auth/google", {
    intent: input.intent,
    clientOrigin: window.location.origin,
    deviceId: getRememberedDeviceId(),
  });
  window.location.assign(url);
}

export function startLinkedInAuth(input: GoogleAuthInput) {
  if (typeof window === "undefined") return;
  const url = buildUrl("/auth/linkedin", {
    intent: input.intent,
    clientOrigin: window.location.origin,
    deviceId: getRememberedDeviceId(),
  });
  window.location.assign(url);
}

export function startMicrosoftAuth(input: GoogleAuthInput) {
  if (typeof window === "undefined") return;
  const url = buildUrl("/auth/microsoft", {
    intent: input.intent,
    clientOrigin: window.location.origin,
    deviceId: getRememberedDeviceId(),
  });
  window.location.assign(url);
}

export async function refresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearToken();
    return null;
  }

  const result = await apiRequest<any>({
    method: "POST",
    path: "/auth/refresh",
    auth: false,
    body: { refreshToken },
  });
  if (result?.accessToken && result?.refreshToken) setToken(result.accessToken, result.refreshToken);
  return result;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearToken();
    return { ok: true };
  }

  try {
    return await apiRequest<any>({
      method: "POST",
      path: "/auth/logout",
      auth: false,
      body: { refreshToken },
    });
  } finally {
    clearToken();
  }
}

export function logoutOnClose() {
  if (typeof window === "undefined") return;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearToken();
    return;
  }

  const url = buildUrl("/auth/logout");
  const body = new URLSearchParams({ refreshToken });
  let queued = false;
  try {
    queued = navigator.sendBeacon(url, body);
  } catch {
    // Fall back to a keepalive request below.
  }
  if (!queued) {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
      keepalive: true,
    }).catch(() => undefined);
  }
  clearToken();
}

export async function logoutAllSessions() {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/logout-all",
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

export async function completeCompanyOnboarding(body: Record<string, unknown>) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/company/complete-onboarding",
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

export async function getTotpStatus() {
  return apiRequest<{ enabled: boolean; recoveryCodesRemaining: number }>({
    method: "GET",
    path: "/auth/totp/status",
  });
}

export async function verifyTotpRecoveryPassword(body: { password: string }) {
  return apiRequest<{ challengeToken: string }>({
    method: "POST",
    path: "/auth/totp/recovery-codes/verify-password",
    body,
  });
}

export async function regenerateTotpRecoveryCodes(body: { challengeToken: string; code: string }) {
  return apiRequest<{ backupCodes: string[]; recoveryCodesRemaining: number }>({
    method: "POST",
    path: "/auth/totp/recovery-codes/regenerate",
    body,
  });
}

export async function totpSetup() {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/totp/setup",
  });
}

export async function totpEnable(body: { code: string }) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/totp/enable",
    body,
  });
}

export async function verifyTotpDisablePassword(body: { password: string }) {
  return apiRequest<{ challengeToken: string }>({
    method: "POST",
    path: "/auth/totp/disable/verify-password",
    body,
  });
}

export async function totpDisable(body: { challengeToken: string; method: "authenticator" | "recovery"; code: string }) {
  const result = await apiRequest<{ enabled: false; sessionsRevoked: true }>({
    method: "POST",
    path: "/auth/totp/disable",
    body,
  });
  if (typeof window !== "undefined") window.localStorage.removeItem("lekhaly_remembered_device");
  return result;
}

export async function stepUp(body: { totpCode: string }) {
  return apiRequest<any>({
    method: "POST",
    path: "/auth/step-up",
    body,
  });
}
