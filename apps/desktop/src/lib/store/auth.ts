// apps/web/src/lib/store/auth.ts

type AuthState = {
  token: string | null;
};

type Listener = (state: AuthState) => void;

const KEY = "lekhaly_token";

let state: AuthState = {
  token: typeof window !== "undefined" ? localStorage.getItem(KEY) : null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

export function getToken() {
  return state.token;
}

export function setToken(token: string) {
  state = { token };
  if (typeof window !== "undefined") localStorage.setItem(KEY, token);
  emit();
}

export function clearToken() {
  state = { token: null };
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
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
    if (e.key !== KEY) return;
    state = { token: e.newValue };
    emit();
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
