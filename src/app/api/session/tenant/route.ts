import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    tenantId?: number;
  };
  if (!body.tenantId || !Number.isInteger(body.tenantId)) {
    return NextResponse.json(
      { message: "El tenant seleccionado no es válido.", errors: {} },
      { status: 422 },
    );
  }
  const cookieStore = await cookies();
  cookieStore.set("crm_tenant_id", String(body.tenantId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ data: { selected: true }, meta: {} });
}
