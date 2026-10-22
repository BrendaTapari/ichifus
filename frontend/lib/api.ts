import { clearSession, getToken } from "@/lib/auth";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function errorMessage(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item: { msg?: string }) => item.msg)
        .filter((item: string | undefined): item is string => Boolean(item));
      if (messages.length) return messages.join(". ");
    }
  } catch {
    return "Ocurrió un error inesperado";
  }
  return "Ocurrió un error inesperado";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });
  if (response.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/google") {
    clearSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
    }
    throw new ApiError("Sesión expirada", 401);
  }
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
