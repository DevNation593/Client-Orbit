import { cookies } from "next/headers";

const API_URL = (process.env.API_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

export async function forwardToBackend(request: Request, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("crm_access_token")?.value;
  const tenantId = cookieStore.get("crm_tenant_id")?.value;
  const sourceHeaders = new Headers(request.headers);
  const headers = new Headers();
  headers.set("Accept", "application/json");
  const contentType = sourceHeaders.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (tenantId) headers.set("X-Tenant-ID", tenantId);

  const query = new URL(request.url).search;
  const target = `${API_URL}/api/v1/${path.join("/")}${query}`;
  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
  const response = await fetch(target, {
    method,
    headers,
    body,
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");
  if (responseContentType)
    responseHeaders.set("Content-Type", responseContentType);
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders,
  });
}
