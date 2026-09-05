import { getDesktopApiBase, getDesktopSessionToken } from "./desktop-session";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  code: string;
  retryable: boolean;
  status: number;

  constructor(code: string, message: string, retryable: boolean, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.retryable = retryable;
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: { method?: string; body?: unknown; timeoutMs?: number }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 15_000;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutError = new ApiError(
    "DESKTOP_API_TIMEOUT",
    "本地服务响应超时，请稍后重试；如持续出现，请打开日志目录。",
    true,
    504
  );
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(timeoutError);
    }, timeoutMs);
  });

  const requestPromise = performApiFetch<T>(path, options);
  try {
    return await Promise.race([requestPromise, timeoutPromise]);
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}

async function performApiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; timeoutMs?: number } | undefined
): Promise<T> {
  const desktopBase = await getDesktopApiBase();
  const url = `${desktopBase ?? BASE_URL}${API_PREFIX}${path}`;
  const method = options?.method ?? "GET";
  const headers: Record<string, string> = {};
  const desktopToken = await getDesktopSessionToken();
  if (desktopToken) headers["X-Desktop-Session"] = desktopToken;

  let body: string | undefined;
  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { method, headers, body });

  if (!response.ok) {
    let code = "UPSTREAM_ERROR";
    let message = `HTTP ${response.status}`;
    let retryable = response.status >= 500;

    try {
      const json = await response.json();
      if (json?.detail?.code) {
        code = json.detail.code;
        message = json.detail.message;
        retryable = json.detail.retryable ?? retryable;
      }
    } catch {
      // non-JSON response, use defaults
    }

    throw new ApiError(code, message, retryable, response.status);
  }

  return response.json() as Promise<T>;
}
