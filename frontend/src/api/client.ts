export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:8080/api/v1`;
  }
  return "http://localhost:8080/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  code?: string;
  fieldErrors?: Record<string, string>;
  status: number;

  constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

type RefreshSession = {
  accessToken: string;
};

let accessToken: string | null = null;
let refreshPromise: Promise<RefreshSession | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function getAuthToken(): string | null {
  return accessToken;
}

/**
 * Khôi phục phiên bằng refresh cookie HttpOnly và dùng chung một request khi có nhiều API đồng thời.
 */
export async function silentRefresh<T extends RefreshSession>(): Promise<T | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          clearAccessToken();
          return null;
        }
        const session = await response.json() as RefreshSession;
        if (!session.accessToken) {
          clearAccessToken();
          return null;
        }
        setAccessToken(session.accessToken);
        return session;
      })
      .catch(() => {
        clearAccessToken();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise as Promise<T | null>;
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
};

function createRequest(options: ApiFetchOptions, token: string | null): RequestInit {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: isFormData
      ? options.body as FormData
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.message || (response.status === 401
        ? "Your session has expired. Please log in again."
        : `Request failed with status ${response.status}`),
      errorBody.code,
      errorBody.fieldErrors,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  let response = await fetch(`${API_BASE_URL}${path}`, createRequest(options, getAuthToken()));

  if (response.status === 401 && !path.startsWith("/auth/")) {
    const session = await silentRefresh<RefreshSession>();
    if (session) {
      response = await fetch(`${API_BASE_URL}${path}`, createRequest(options, session.accessToken));
    }
  }

  return parseResponse<T>(response);
}
