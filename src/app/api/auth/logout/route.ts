import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = (process.env.API_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("crm_access_token")?.value;
  if (token) {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ data: { logged_out: true }, meta: {} });
  response.cookies.delete("crm_access_token");
  response.cookies.delete("crm_tenant_id");
  return response;
}
