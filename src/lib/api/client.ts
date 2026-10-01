import type { ApiResponse, QueryParams } from "@/types/api";
import { ApiError } from "./error";

const API_PREFIX = "/api/backend";

function buildUrl(path: string, query?: QueryParams) {
  const normalizedPath = path.replace(/^\/+/, "");
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  return `${API_PREFIX}/${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: QueryParams;
  body?: unknown;
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => undefined);
  }
  return response.text().catch(() => undefined);
}

async function execute(path: string, options: RequestOptions = {}) {
  const { body, query, headers: incomingHeaders, ...init } = options;
  const headers = new Headers(incomingHeaders);
  headers.set("Accept", "application/json");

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers,
    body: requestBody,
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readPayload(response);

  return { response, payload };
}

export async function requestEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { response, payload } = await execute(path, options);
  if (!response.ok) {
    const error = ApiError.fromPayload(payload, response.status);
    if (error.isUnauthorized && typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("crm:unauthorized"));
    throw error;
  }
  if (payload && typeof payload === "object" && "data" in payload)
    return payload as ApiResponse<T>;
  return { data: payload as T, meta: {} };
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const envelope = await requestEnvelope<T>(path, options);
  return envelope.data;
}

export const apiClient = {
  get: <T>(path: string, query?: QueryParams) =>
    request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  requestEnvelope,
  request,
};
