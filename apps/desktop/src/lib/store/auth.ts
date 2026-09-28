// apps/web/src/lib/store/auth.ts

type AuthState = {
  token: string | null;
  refreshToken: string | null;
};

type Listener = (state: AuthState) => void;

const KEY = "lekhaly_token";
const REFRESH_KEY = "lekhaly_refresh_token";

let state: AuthState = {
  token: typeof window !== "undefined" ? localStorage.getItem(KEY) : null,
  refreshToken: typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

export function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem(KEY) : state.token;
}

export function getRefreshToken() {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : state.refreshToken;
}

export function setToken(token: string, refreshToken?: string) {
  state = { token, refreshToken: refreshToken ?? null };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    else localStorage.removeItem(REFRESH_KEY);
  }
  emit();
}

export function clearToken() {
  state = { token: null, refreshToken: null };
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
  emit();
}

export function subscribeAuth(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Handy helper to keep in sync with other tabs.
 */
export function initAuthStorageSync() {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY && e.key !== REFRESH_KEY) return;
    state = {
      token: localStorage.getItem(KEY),
      refreshToken: localStorage.getItem(REFRESH_KEY)
    };
    emit();
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
