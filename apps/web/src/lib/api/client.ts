// apps/web/src/lib/api/client.ts

export type ApiErrorResponse = {
  statusCode?: number;
  message?: string;
  error?: string;
};

export type OfflineQueuedResponse = {
  offlineQueued: true;
  localId: string;
  message: string;
};

export class ApiError extends Error {
  status?: number;
  details?: ApiErrorResponse;

  constructor(message: string, status?: number, details?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type OfflineQueueItem = {
  id: string;
  method: HttpMethod;
  path: string;
  body: unknown;
  createdAt: string;
  resource: "voucher" | "invoice";
};

type RequestOptions = {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // default true
  offlineQueue?: {
    enabled: boolean;
    resource: "voucher" | "invoice";
  };
};

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000/v1";
const OFFLINE_DB_NAME = "lekhaly-offline-db";
const OFFLINE_STORE_NAME = "pending-api-requests";
export const OFFLINE_SYNC_EVENT = "lekhaly:offline-sync";

export function buildUrl(path: string, query?: RequestOptions["query"]) {
  let base = DEFAULT_BASE_URL.endsWith("/") ? DEFAULT_BASE_URL.slice(0, -1) : DEFAULT_BASE_URL;
  if (base.endsWith("/v1")) base = base.slice(0, -3);
  if (base.endsWith("/v1/")) base = base.slice(0, -4);
  const normalizedPath = path.startsWith("/v1") ? path : `/v1${path}`;
  const url = new URL(normalizedPath, base);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lekhaly_token");
}

function createLocalId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isOfflineQueuedResponse(value: unknown): value is OfflineQueuedResponse {
  return !!value && typeof value === "object" && (value as OfflineQueuedResponse).offlineQueued === true;
}

function canUseIndexedDb() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open offline database."));
  });
}

async function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => void | Promise<T>): Promise<T> {
  const db = await openOfflineDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, mode);
    const store = tx.objectStore(OFFLINE_STORE_NAME);
    let resolvedValue: T | undefined;

    Promise.resolve(handler(store))
      .then((result) => {
        resolvedValue = result as T;
      })
      .catch((error) => {
        db.close();
        reject(error);
      });

    tx.oncomplete = () => {
      db.close();
      resolve(resolvedValue as T);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Offline transaction failed."));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("Offline transaction aborted."));
    };
  });
}

async function putOfflineQueueItem(item: OfflineQueueItem) {
  if (!canUseIndexedDb()) {
    throw new Error("Offline storage is unavailable in this browser.");
  }

  await withStore("readwrite", (store) => {
    store.put(item);
  });
}

async function getOfflineQueueItems(): Promise<OfflineQueueItem[]> {
  if (!canUseIndexedDb()) return [];

  return withStore("readonly", (store) => {
    return new Promise<OfflineQueueItem[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result as OfflineQueueItem[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error("Failed to read offline queue."));
    });
  });
}

async function deleteOfflineQueueItem(id: string) {
  if (!canUseIndexedDb()) return;

  await withStore("readwrite", (store) => {
    store.delete(id);
  });
}

export async function getPendingOfflineRequestCount() {
  const items = await getOfflineQueueItems();
  return items.length;
}

function emitOfflineSyncEvent(detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_EVENT, { detail }));
}

function isLikelyNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === "TypeError" || /network|fetch|failed to fetch|load failed/i.test(error.message);
}

async function queueOfflineRequest(opts: RequestOptions): Promise<OfflineQueuedResponse> {
  const config = opts.offlineQueue;
  if (!config?.enabled || opts.body === undefined) {
    throw new Error("Offline queueing is not available for this request.");
  }

  const localId = createLocalId();
  await putOfflineQueueItem({
    id: localId,
    method: opts.method ?? "GET",
    path: opts.path,
    body: opts.body,
    createdAt: new Date().toISOString(),
    resource: config.resource,
  });

  emitOfflineSyncEvent({ queued: true, localId });

  return {
    offlineQueued: true,
    localId,
    message: "Offline mode: draft saved to local storage. Go online to sync it with the server.",
  };
}

async function buildRequestHeaders(opts: RequestOptions) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (opts.auth ?? true) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function executeRequest(opts: RequestOptions) {
  const headers = await buildRequestHeaders(opts);
  return fetch(buildUrl(opts.path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

export async function syncPendingOfflineRequests() {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0, pending: await getPendingOfflineRequestCount() };
  }

  const items = await getOfflineQueueItems();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const response = await executeRequest({
        method: item.method,
        path: item.path,
        body: item.body,
      });

      if (!response.ok) {
        if (response.status >= 500) {
          failed += 1;
          continue;
        }
        await deleteOfflineQueueItem(item.id);
        failed += 1;
        continue;
      }

      await deleteOfflineQueueItem(item.id);
      synced += 1;
    } catch (error) {
      if (isLikelyNetworkError(error)) break;
      failed += 1;
    }
  }

  const pending = await getPendingOfflineRequestCount();
  emitOfflineSyncEvent({ synced, failed, pending });
  return { synced, failed, pending };
}

export async function apiRequest<T>(opts: RequestOptions): Promise<T> {
  if (opts.offlineQueue?.enabled && typeof window !== "undefined" && navigator.onLine === false) {
    return (await queueOfflineRequest(opts)) as T;
  }

  let res: Response;
  try {
    res = await executeRequest(opts);
  } catch (error) {
    if (opts.offlineQueue?.enabled && isLikelyNetworkError(error)) {
      return (await queueOfflineRequest(opts)) as T;
    }
    throw error;
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const errObj: ApiErrorResponse =
      typeof data === "object" && data ? data : { message: String(data ?? "Request failed") };

    const msg =
      errObj?.message ||
      errObj?.error ||
      `Request failed with status ${res.status}`;

    // Handle session expiration
    if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      localStorage.removeItem("lekhaly_token");
      window.location.href = "/login";
    }

    throw new ApiError(msg, res.status, errObj);
  }

  return data as T;
}
