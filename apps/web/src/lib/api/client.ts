// apps/web/src/lib/api/client.ts

export type ApiErrorResponse = {
  statusCode?: number;
  message?: string;
  error?: string;
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

type RequestOptions = {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // default true
};

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:3000";

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path, DEFAULT_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function getToken() {
  // Later you can move to httpOnly cookies. For now keep simple.
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lekhaly_token");
}

export async function apiRequest<T>(opts: RequestOptions): Promise<T> {
  const method = opts.method ?? "GET";
  const auth = opts.auth ?? true;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(opts.path, opts.query), {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  // Try parsing json, but don’t crash if empty
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

    throw new ApiError(msg, res.status, errObj);
  }

  return data as T;
}
