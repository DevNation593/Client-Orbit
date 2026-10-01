import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = (process.env.API_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

export async function POST(request: Request) {
  const source = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const token = typeof source.token === "string" ? source.token : "";
  if (!/^[A-Za-z0-9]{64}$/.test(token)) {
    return NextResponse.json(
      {
        message: "La invitación es inválida.",
        errors: { token: ["Token inválido."] },
      },
      { status: 422 },
    );
  }
  delete source.token;

  const response = await fetch(
    `${API_URL}/api/v1/auth/invitations/${token}/accept`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(source),
      cache: "no-store",
    },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    data?: Record<string, unknown>;
    [key: string]: unknown;
  };
  if (!response.ok || !payload.data || typeof payload.data.token !== "string") {
    return NextResponse.json(payload, { status: response.status });
  }

  const accessToken = payload.data.token;
  const tenant = payload.data.tenant as { id?: number } | undefined;
  const data = { ...payload.data };
  delete data.token;
  delete data.token_type;
  const result = NextResponse.json(
    { ...payload, data },
    { status: response.status },
  );
  const cookieStore = await cookies();
  cookieStore.set("crm_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  if (tenant?.id) {
    cookieStore.set("crm_tenant_id", String(tenant.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return result;
}
