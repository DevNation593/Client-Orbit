"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Copy, ShieldCheck, UserPlus } from "lucide-react";
import {
  useInviteUser,
  useInvitations,
  useRevokeInvitation,
  useRoles,
  useUpdateUserRole,
  useUsers,
} from "@/hooks/use-crm";
import { ApiError } from "@/lib/api/error";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/async-state";
import { Avatar } from "@/components/common/avatar";
import { StatusBadge } from "@/components/common/status-badge";
import { Can } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default function TeamSettingsPage() {
  const [page] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role_id: "" });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    acceptanceUrl?: string;
    notificationSent: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [roleSelections, setRoleSelections] = useState<Record<number, string>>(
    {},
  );
  const [roleError, setRoleError] = useState<string | null>(null);
  const users = useUsers({ page, per_page: 50 });
  const roles = useRoles();
  const invitations = useInvitations();
  const updateRole = useUpdateUserRole();
  const invite = useInviteUser();
  const revoke = useRevokeInvitation();

  useEffect(() => {
    const firstRole = roles.data?.[0];
    if (firstRole && !inviteForm.role_id) {
      setInviteForm((current) => ({
        ...current,
        role_id: String(firstRole.id),
      }));
    }
  }, [inviteForm.role_id, roles.data]);

  useEffect(() => {
    if (!users.data?.items) return;
    setRoleSelections((current) => {
      const next = { ...current };
      let changed = false;
      for (const membership of users.data.items) {
        const value = String(membership.role?.id ?? membership.role_id ?? "");
        if (next[membership.user.id] !== value) {
          next[membership.user.id] = value;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [users.data]);

  const roleValue = (userId: number, roleId?: number) =>
    roleSelections[userId] ?? String(roleId ?? "");

  const changeRole = async (userId: number, roleId: string) => {
    setRoleError(null);
    setRoleSelections((current) => ({ ...current, [userId]: roleId }));
    try {
      await updateRole.mutateAsync({
        id: userId,
        body: { role_id: Number(roleId) },
      });
    } catch (error) {
      setRoleError(
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el rol.",
      );
      const membership = users.data?.items.find(
        (entry) => entry.user.id === userId,
      );
      setRoleSelections((current) => ({
        ...current,
        [userId]: String(membership?.role?.id ?? membership?.role_id ?? ""),
      }));
    }
  };

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteError(null);
    setInviteResult(null);
    setCopied(false);
    try {
      const result = await invite.mutateAsync({
        email: inviteForm.email,
        role_id: Number(inviteForm.role_id),
      });
      setInviteResult(result);
      setInviteForm((current) => ({ ...current, email: "" }));
    } catch (error) {
      setInviteError(
        error instanceof ApiError
          ? error.message
          : "No se pudo crear la invitación.",
      );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Equipo y roles"
        description="Gestiona quién puede acceder al espacio y con qué permisos."
        action={
          <Can permission="users.manage">
            <Button
              onClick={() => {
                setInviteError(null);
                setInviteResult(null);
                setInviteOpen(true);
              }}
            >
              <UserPlus size={16} />
              Invitar usuario
            </Button>
          </Can>
        }
      />
      {users.isError || roles.isError ? (
        <ErrorState
          onRetry={() => {
            void users.refetch();
            void roles.refetch();
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Miembros del espacio</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {roleError ? (
                <p className="text-danger mx-5 mt-5 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
                  {roleError}
                </p>
              ) : null}
              <div className="divide-border divide-y">
                {users.data?.items.map((membership) => (
                  <div
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                    key={membership.id}
                  >
                    <Avatar name={membership.user.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{membership.user.name}</p>
                      <p className="text-muted text-xs">
                        {membership.user.email}
                      </p>
                    </div>
                    <StatusBadge value={membership.status} />
                    <Select
                      aria-label={"Rol de " + membership.user.name}
                      className="w-auto min-w-[150px]"
                      disabled={updateRole.isPending}
                      value={roleValue(
                        membership.user.id,
                        membership.role?.id ?? membership.role_id,
                      )}
                      onChange={(event) =>
                        void changeRole(membership.user.id, event.target.value)
                      }
                    >
                      <option value="">Sin rol</option>
                      {roles.data?.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
                {!users.isLoading && !users.data?.items.length ? (
                  <p className="text-muted p-8 text-center text-sm">
                    No hay miembros para mostrar.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Roles disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.data?.map((role) => (
                <div
                  className="border-border rounded-xl border p-3"
                  key={role.id}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-brand" size={16} />
                    <p className="font-semibold">{role.name}</p>
                  </div>
                  <p className="text-muted mt-1 text-xs">
                    {role.permissions?.length ?? 0} permisos configurados
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      {invitations.data?.length ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Invitaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent className="divide-border divide-y p-0">
            {invitations.data.map((invitation) => (
              <div
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                key={invitation.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{invitation.email}</p>
                  <p className="text-muted text-xs">
                    Rol: {invitation.role?.name ?? "Sin rol"} · vence{" "}
                    {new Date(invitation.expires_at).toLocaleDateString(
                      "es-EC",
                    )}
                  </p>
                </div>
                <Can permission="users.manage">
                  <Button
                    disabled={revoke.isPending}
                    size="sm"
                    variant="secondary"
                    onClick={() => void revoke.mutateAsync(invitation.id)}
                  >
                    Revocar
                  </Button>
                </Can>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Dialog
        description="La invitación vence en 7 días y asignará el rol seleccionado."
        onClose={() => setInviteOpen(false)}
        open={inviteOpen}
        title="Invitar usuario"
      >
        {inviteResult ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              {inviteResult.notificationSent
                ? "La invitación fue creada y se envió al correo indicado."
                : "La invitación fue creada, pero el correo no pudo enviarse. Comparte el enlace si está disponible."}
            </div>
            {inviteResult.acceptanceUrl ? (
              <div>
                <Label htmlFor="acceptance-url">Enlace de invitación</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="acceptance-url"
                    readOnly
                    value={inviteResult.acceptanceUrl}
                  />
                  <Button
                    aria-label="Copiar enlace de invitación"
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(inviteResult.acceptanceUrl ?? "")
                        .then(() => setCopied(true));
                    }}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
                {copied ? (
                  <p className="text-success mt-1.5 text-xs">Enlace copiado.</p>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button onClick={() => setInviteOpen(false)}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => void submitInvite(event)}
          >
            <div>
              <Label htmlFor="invite-email">Correo electrónico</Label>
              <Input
                autoComplete="email"
                id="invite-email"
                required
                type="email"
                value={inviteForm.email}
                onChange={(event) =>
                  setInviteForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Rol</Label>
              <Select
                id="invite-role"
                required
                value={inviteForm.role_id}
                onChange={(event) =>
                  setInviteForm((current) => ({
                    ...current,
                    role_id: event.target.value,
                  }))
                }
              >
                <option value="">Selecciona un rol</option>
                {roles.data?.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </div>
            {inviteError ? (
              <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
                {inviteError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                Cancelar
              </Button>
              <Button
                disabled={invite.isPending || !roles.data?.length}
                type="submit"
              >
                {invite.isPending ? "Enviando…" : "Enviar invitación"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
