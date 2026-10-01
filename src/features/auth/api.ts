import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";
import type { InvitationDetails, Tenant, User } from "@/types/domain";

export interface AuthSession {
  user: User;
  tenant: Tenant;
}

interface SessionEnvelope {
  data: AuthSession & { token?: string; token_type?: string };
  meta?: Record<string, unknown>;
}

async function sessionRequest(path: "login" | "register", body: unknown) {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => undefined)) as
    | SessionEnvelope
    | { message?: string; errors?: Record<string, string[]> }
    | undefined;
  if (!response.ok) throw ApiError.fromPayload(payload, response.status);
  return (payload as SessionEnvelope).data;
}

async function acceptInvitation(token: string, body: unknown) {
  const response = await fetch("/api/auth/invitations/accept", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ token, ...(body as Record<string, unknown>) }),
  });
  const payload = (await response.json().catch(() => undefined)) as
    | SessionEnvelope
    | { message?: string; errors?: Record<string, string[]> }
    | undefined;
  if (!response.ok) throw ApiError.fromPayload(payload, response.status);
  return (payload as SessionEnvelope).data;
}

export const authApi = {
  login: (body: unknown) => sessionRequest("login", body),
  register: (body: unknown) => sessionRequest("register", body),
  me: () => apiClient.get<AuthSession>("auth/me"),
  logout: () =>
    fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }),
  forgotPassword: (body: unknown) =>
    apiClient.post<{ message: string }>("auth/forgot-password", body),
  resetPassword: (body: unknown) =>
    apiClient.post<{ reset: boolean }>("auth/reset-password", body),
  updatePassword: (body: unknown) =>
    apiClient.put<{ updated: boolean }>("auth/password", body),
  invitation: (token: string) =>
    apiClient.get<InvitationDetails>(`auth/invitations/${token}`),
  acceptInvitation,
  selectTenant: async (tenantId: number) => {
    const response = await fetch("/api/session/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
      credentials: "same-origin",
    });
    if (!response.ok)
      throw ApiError.fromPayload(
        await response.json().catch(() => undefined),
        response.status,
      );
  },
};
