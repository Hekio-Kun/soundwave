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

export function getAuthToken(): string | null {
  return (
    localStorage.getItem("soundwave_access_token") ??
    sessionStorage.getItem("soundwave_access_token")
  );
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const token = getAuthToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (options.body !== undefined && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const getBody = () => (isFormData ? (options.body as FormData) : (options.body !== undefined ? JSON.stringify(options.body) : undefined));

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: getBody(),
  });

  if (!response.ok) {
    if (response.status === 401 && !path.includes("/auth/")) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) {
          const session = await refreshRes.json();
          if (session?.accessToken) {
            const storage = localStorage.getItem("soundwave_access_token") ? localStorage : sessionStorage;
            storage.setItem("soundwave_access_token", session.accessToken);
            headers["Authorization"] = `Bearer ${session.accessToken}`;
            const retryRes = await fetch(`${API_BASE_URL}${path}`, {
              method: options.method ?? "GET",
              credentials: "include",
              headers,
              body: getBody(),
            });
            if (retryRes.ok) {
              if (retryRes.status === 204) return undefined as T;
              return retryRes.json() as Promise<T>;
            }
          }
        }
      } catch {
        // Fall through to error throwing
      }
    }

    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.message || (response.status === 401 ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : `Request failed with status ${response.status}`),
      errorBody.code,
      errorBody.fieldErrors
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
