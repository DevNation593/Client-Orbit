"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Copy,
  Link2,
  MoreHorizontal,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useConnectIntegration,
  useCreateIntegration,
  useCreateWebhookEndpoint,
  useDeleteIntegration,
  useDeleteWebhookEndpoint,
  useDisconnectIntegration,
  useIntegrationHealth,
  useIntegrationProviders,
  useIntegrations,
  useUpdateIntegration,
  useUpdateWebhookEndpoint,
  useWebhookEndpoints,
} from "@/hooks/use-integrations";
import { ApiError } from "@/lib/api/error";
import { PageHeader } from "@/components/common/page-header";
import {
  ErrorState,
  EmptyState,
  ListSkeleton,
} from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { Can } from "@/components/common/can";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type {
  Integration,
  IntegrationHealth,
  IntegrationProviderDefinition,
  WebhookEndpoint,
} from "@/types/domain";

interface IntegrationForm {
  provider: string;
  name: string;
  credentials: Record<string, string>;
  settings: Record<string, string>;
  status: "pending" | "disabled";
}

interface WebhookForm {
  name: string;
  url: string;
  events: string;
  active: boolean;
}

const fallbackProviders: IntegrationProviderDefinition[] = [
  {
    key: "google",
    label: "Google",
    description: "Valida una cuenta de Google mediante OAuth.",
    fields: [
      {
        key: "access_token",
        target: "credentials",
        label: "Token de acceso OAuth",
        type: "password",
        required: true,
      },
    ],
  },
  {
    key: "microsoft",
    label: "Microsoft 365",
    description: "Valida una cuenta mediante Microsoft Graph.",
    fields: [
      {
        key: "access_token",
        target: "credentials",
        label: "Token de acceso OAuth",
        type: "password",
        required: true,
      },
    ],
  },
  {
    key: "whatsapp",
    label: "WhatsApp Business",
    description: "Conecta WhatsApp Cloud API.",
    fields: [
      {
        key: "access_token",
        target: "credentials",
        label: "Token de acceso",
        type: "password",
        required: true,
      },
      {
        key: "api_version",
        target: "settings",
        label: "Versión de Graph API",
        type: "text",
        required: true,
        placeholder: "vXX.X",
      },
      {
        key: "phone_number_id",
        target: "settings",
        label: "Phone number ID",
        type: "text",
        required: true,
      },
    ],
  },
  {
    key: "meta",
    label: "Meta",
    description: "Conecta páginas y eventos de Meta.",
    fields: [
      {
        key: "access_token",
        target: "credentials",
        label: "Token de acceso",
        type: "password",
        required: true,
      },
      {
        key: "api_version",
        target: "settings",
        label: "Versión de Graph API",
        type: "text",
        required: true,
        placeholder: "vXX.X",
      },
      {
        key: "object_id",
        target: "settings",
        label: "ID del objeto de Meta",
        type: "text",
        required: true,
      },
    ],
  },
  {
    key: "twilio",
    label: "Twilio",
    description: "Conecta SMS y mensajería transaccional.",
    fields: [
      {
        key: "account_sid",
        target: "credentials",
        label: "Account SID",
        type: "password",
        required: true,
        placeholder: "AC…",
      },
      {
        key: "auth_token",
        target: "credentials",
        label: "Auth Token",
        type: "password",
        required: true,
      },
    ],
  },
  {
    key: "custom_webhook",
    label: "Otro servicio HTTP",
    description: "Comprueba un endpoint público con un token opcional.",
    fields: [
      {
        key: "health_url",
        target: "settings",
        label: "URL de comprobación",
        type: "url",
        required: true,
        placeholder: "https://api.ejemplo.com/health",
      },
      {
        key: "access_token",
        target: "credentials",
        label: "Token Bearer",
        type: "password",
        required: false,
      },
    ],
  },
];

const initialWebhookForm: WebhookForm = {
  name: "",
  url: "",
  events: "contact.created, lead.created, deal.stage_changed",
  active: true,
};

export default function IntegrationsSettingsPage() {
  const [integrationOpen, setIntegrationOpen] = useState(false);
  const [integrationId, setIntegrationId] = useState<number | null>(null);
  const [integrationForm, setIntegrationForm] = useState<IntegrationForm>({
    provider: "google",
    name: "",
    credentials: {},
    settings: {},
    status: "pending",
  });
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookId, setWebhookId] = useState<number | null>(null);
  const [webhookForm, setWebhookForm] =
    useState<WebhookForm>(initialWebhookForm);
  const [removeIntegrationId, setRemoveIntegrationId] = useState<number | null>(
    null,
  );
  const [removeWebhookId, setRemoveWebhookId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [webhookIngressUrl, setWebhookIngressUrl] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [healthById, setHealthById] = useState<
    Record<number, IntegrationHealth>
  >({});
  const integrations = useIntegrations();
  const providerCatalog = useIntegrationProviders();
  const webhooks = useWebhookEndpoints();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const removeIntegration = useDeleteIntegration();
  const health = useIntegrationHealth();
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();
  const createWebhook = useCreateWebhookEndpoint();
  const updateWebhook = useUpdateWebhookEndpoint();
  const removeWebhook = useDeleteWebhookEndpoint();
  const providers = providerCatalog.data?.length
    ? providerCatalog.data
    : fallbackProviders;
  const selectedProvider =
    providers.find((provider) => provider.key === integrationForm.provider) ??
    providers[0];

  const openCreateIntegration = () => {
    setIntegrationId(null);
    setFormError(null);
    setIntegrationForm({
      provider: providers[0]?.key ?? "google",
      name: "",
      credentials: {},
      settings: {},
      status: "pending",
    });
    setIntegrationOpen(true);
  };

  const openEditIntegration = (integration: Integration) => {
    setIntegrationId(integration.id);
    setFormError(null);
    setIntegrationForm({
      provider: integration.provider,
      name: integration.name,
      credentials: {},
      settings: {},
      status: integration.status === "disabled" ? "disabled" : "pending",
    });
    setIntegrationOpen(true);
  };

  const submitIntegration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const credentials = nonEmptyValues(integrationForm.credentials);
    const settings = nonEmptyValues(integrationForm.settings);
    try {
      if (integrationId === null) {
        await createIntegration.mutateAsync({
          provider: integrationForm.provider,
          name: integrationForm.name.trim(),
          credentials,
          settings,
        });
      } else {
        await updateIntegration.mutateAsync({
          id: integrationId,
          body: {
            name: integrationForm.name.trim(),
            credentials,
            settings,
            status: integrationForm.status,
          },
        });
      }
      setIntegrationOpen(false);
    } catch (error) {
      setFormError(errorMessage(error, "No se pudo guardar la integración."));
    }
  };

  const checkHealth = async (id: number) => {
    setOperationError(null);
    try {
      const result = await health.mutateAsync(id);
      setHealthById((current) => ({ ...current, [id]: result }));
    } catch (error) {
      setOperationError(
        errorMessage(error, "No se pudo comprobar la conexión."),
      );
    }
  };

  const connectIntegration = async (id: number) => {
    setOperationError(null);
    try {
      await connect.mutateAsync(id);
    } catch (error) {
      setOperationError(
        errorMessage(error, "No se pudo conectar la integración."),
      );
    }
  };

  const disconnectIntegration = async (id: number) => {
    setOperationError(null);
    try {
      await disconnect.mutateAsync(id);
    } catch (error) {
      setOperationError(
        errorMessage(error, "No se pudo desconectar la integración."),
      );
    }
  };

  const openCreateWebhook = () => {
    setWebhookId(null);
    setFormError(null);
    setWebhookForm(initialWebhookForm);
    setWebhookOpen(true);
  };

  const openEditWebhook = (endpoint: WebhookEndpoint) => {
    setWebhookId(endpoint.id);
    setFormError(null);
    setWebhookForm({
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events?.join(", ") ?? "",
      active: endpoint.active !== false,
    });
    setWebhookOpen(true);
  };

  const submitWebhook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const body = {
      name: webhookForm.name.trim(),
      url: webhookForm.url.trim(),
      events: webhookForm.events
        .split(/[,\n;]/)
        .map((eventName) => eventName.trim().toLowerCase())
        .filter(Boolean),
      active: webhookForm.active,
    };
    try {
      if (webhookId === null) {
        const result = await createWebhook.mutateAsync(body);
        setWebhookSecret(result.signing_secret ?? null);
        setWebhookIngressUrl(result.ingress_url ?? null);
      } else {
        await updateWebhook.mutateAsync({ id: webhookId, body });
      }
      setWebhookOpen(false);
    } catch (error) {
      setFormError(
        errorMessage(error, "No se pudo guardar el endpoint webhook."),
      );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Integraciones"
        description="Conecta servicios externos con credenciales cifradas y administra endpoints webhook."
        action={
          <Can permission="integrations.manage">
            <Button onClick={openCreateIntegration}>
              <Plus size={16} />
              Nueva integración
            </Button>
          </Can>
        }
      />
      {operationError ? (
        <p className="text-danger mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
          {operationError}
        </p>
      ) : null}
      {integrations.isError ? (
        <ErrorState onRetry={() => void integrations.refetch()} />
      ) : integrations.isLoading ? (
        <ListSkeleton rows={3} />
      ) : integrations.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.data.map((integration) => {
            const provider = providers.find(
              (entry) => entry.key === integration.provider,
            );
            const result = healthById[integration.id];
            return (
              <Card key={integration.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                      <Link2 size={21} />
                    </span>
                    <Can permission="integrations.manage">
                      <Button
                        aria-label={"Acciones para " + integration.name}
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditIntegration(integration)}
                      >
                        <MoreHorizontal size={17} />
                      </Button>
                    </Can>
                  </div>
                  <h2 className="mt-5 font-bold">{integration.name}</h2>
                  <p className="text-muted mt-1 text-sm">
                    {provider?.label ?? integration.provider}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge value={integration.status} />
                    {integration.last_synced_at ? (
                      <span className="text-muted text-xs">
                        Verificada{" "}
                        {new Date(
                          integration.last_synced_at,
                        ).toLocaleDateString("es-EC")}
                      </span>
                    ) : null}
                  </div>
                  {result ? (
                    <div
                      className={
                        result.ok
                          ? "mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
                          : "mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
                      }
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 size={15} />
                        {result.message}
                      </div>
                      <p className="mt-1 text-xs">
                        Comprobado{" "}
                        {new Date(result.checked_at).toLocaleString("es-EC")}
                      </p>
                    </div>
                  ) : null}
                  <Can permission="integrations.manage">
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        disabled={health.isPending}
                        size="sm"
                        variant="secondary"
                        onClick={() => void checkHealth(integration.id)}
                      >
                        <RefreshCw size={14} />
                        Probar conexión
                      </Button>
                      {integration.status === "active" ? (
                        <Button
                          disabled={disconnect.isPending}
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void disconnectIntegration(integration.id)
                          }
                        >
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          disabled={connect.isPending}
                          size="sm"
                          onClick={() =>
                            void connectIntegration(integration.id)
                          }
                        >
                          Conectar
                        </Button>
                      )}
                      <Button
                        aria-label={"Eliminar " + integration.name}
                        size="sm"
                        variant="danger"
                        onClick={() => setRemoveIntegrationId(integration.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </Can>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          action={
            <Can permission="integrations.manage">
              <Button onClick={openCreateIntegration}>
                <Plus size={16} />
                Conectar servicio
              </Button>
            </Can>
          }
          description="Configura un proveedor para sincronizar servicios externos."
          title="No hay integraciones"
        />
      )}
      {webhookSecret ? (
        <Card className="mt-6 border-amber-200 bg-amber-50/50">
          <CardContent className="p-5">
            <h2 className="font-bold text-amber-900">
              Credenciales webhook generadas
            </h2>
            <p className="text-muted mt-1 text-sm">
              Guarda estos datos ahora; por seguridad el secreto no volverá a
              mostrarse.
            </p>
            <div className="mt-3 space-y-3">
              {webhookIngressUrl ? (
                <div>
                  <Label htmlFor="webhook-ingress-url">URL de recepción</Label>
                  <Input
                    id="webhook-ingress-url"
                    readOnly
                    value={webhookIngressUrl}
                  />
                </div>
              ) : null}
              <div>
                <Label htmlFor="webhook-signing-secret">Secreto de firma</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-signing-secret"
                    readOnly
                    value={webhookSecret}
                  />
                  <Button
                    aria-label="Copiar secreto webhook"
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      if (!navigator.clipboard) return;
                      void navigator.clipboard
                        .writeText(webhookSecret)
                        .then(() => setCopied(true));
                    }}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
            </div>
            {copied ? (
              <p className="text-success mt-1.5 text-xs">Secreto copiado.</p>
            ) : null}
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onClick={() => {
                setWebhookSecret(null);
                setWebhookIngressUrl(null);
                setCopied(false);
              }}
            >
              Ocultar secreto
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Endpoints webhook</CardTitle>
              <p className="text-muted mt-1 text-sm">
                Recibe y entrega eventos firmados desde servicios externos.
              </p>
            </div>
            <Can permission="webhooks.manage">
              <Button size="sm" onClick={openCreateWebhook}>
                <Plus size={15} />
                Nuevo endpoint
              </Button>
            </Can>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {webhooks.isError ? (
            <div className="p-5">
              <ErrorState onRetry={() => void webhooks.refetch()} />
            </div>
          ) : webhooks.isLoading ? (
            <div className="p-5">
              <ListSkeleton rows={2} />
            </div>
          ) : webhooks.data?.length ? (
            <div className="divide-border divide-y">
              {webhooks.data.map((endpoint) => (
                <div
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                  key={endpoint.id}
                >
                  <span className="bg-brand-soft text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Link2 size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{endpoint.name}</p>
                    <p className="text-muted truncate text-xs">
                      {endpoint.url}
                    </p>
                    <p className="text-muted mt-1 text-xs">
                      {endpoint.events?.length
                        ? endpoint.events.join(" · ")
                        : "Todos los eventos"}
                    </p>
                  </div>
                  <StatusBadge
                    value={endpoint.active ? "active" : "disabled"}
                    label={endpoint.active ? "Activo" : "Pausado"}
                  />
                  <Can permission="webhooks.manage">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditWebhook(endpoint)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRemoveWebhookId(endpoint.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </Can>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted p-8 text-center text-sm">
              No hay endpoints webhook configurados.
            </p>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        description="Se eliminará la integración y se borrarán sus credenciales cifradas."
        loading={removeIntegration.isPending}
        onClose={() => setRemoveIntegrationId(null)}
        onConfirm={() => {
          if (removeIntegrationId === null) return;
          void removeIntegration
            .mutateAsync(removeIntegrationId)
            .then(() => setRemoveIntegrationId(null))
            .catch((error: unknown) =>
              setOperationError(
                errorMessage(error, "No se pudo eliminar la integración."),
              ),
            );
        }}
        open={removeIntegrationId !== null}
        title="Eliminar integración"
      />
      <ConfirmDialog
        description="Se dejará de enviar y recibir eventos en este endpoint."
        loading={removeWebhook.isPending}
        onClose={() => setRemoveWebhookId(null)}
        onConfirm={() => {
          if (removeWebhookId === null) return;
          void removeWebhook
            .mutateAsync(removeWebhookId)
            .then(() => setRemoveWebhookId(null))
            .catch((error: unknown) =>
              setOperationError(
                errorMessage(error, "No se pudo eliminar el endpoint."),
              ),
            );
        }}
        open={removeWebhookId !== null}
        title="Eliminar endpoint webhook"
      />
      <Dialog
        description={
          integrationId === null
            ? "Las credenciales se cifran y no se vuelven a mostrar."
            : "Deja vacíos los campos secretos que quieras conservar."
        }
        onClose={() => setIntegrationOpen(false)}
        open={integrationOpen}
        title={
          integrationId === null
            ? "Añadir integración"
            : "Configurar integración"
        }
      >
        <form
          className="space-y-4"
          onSubmit={(event) => void submitIntegration(event)}
        >
          {integrationId === null ? (
            <div>
              <Label htmlFor="integration-provider">Proveedor</Label>
              <Select
                id="integration-provider"
                value={integrationForm.provider}
                onChange={(event) =>
                  setIntegrationForm((current) => ({
                    ...current,
                    provider: event.target.value,
                    credentials: {},
                    settings: {},
                  }))
                }
              >
                {providers.map((provider) => (
                  <option key={provider.key} value={provider.key}>
                    {provider.label}
                  </option>
                ))}
              </Select>
              <p className="text-muted mt-1.5 text-xs">
                {selectedProvider?.description}
              </p>
            </div>
          ) : null}
          <div>
            <Label htmlFor="integration-name">Nombre visible</Label>
            <Input
              id="integration-name"
              required
              value={integrationForm.name}
              onChange={(event) =>
                setIntegrationForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          {selectedProvider?.fields.map((field) => {
            const values = integrationForm[field.target];
            return (
              <div key={field.target + "." + field.key}>
                <Label
                  htmlFor={"integration-" + field.target + "-" + field.key}
                >
                  {field.label}
                </Label>
                <Input
                  id={"integration-" + field.target + "-" + field.key}
                  placeholder={field.placeholder}
                  required={field.required && integrationId === null}
                  type={field.type}
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setIntegrationForm((current) => ({
                      ...current,
                      [field.target]: {
                        ...current[field.target],
                        [field.key]: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            );
          })}
          {integrationId !== null ? (
            <div>
              <Label htmlFor="integration-status">Estado local</Label>
              <Select
                id="integration-status"
                value={integrationForm.status}
                onChange={(event) =>
                  setIntegrationForm((current) => ({
                    ...current,
                    status: event.target.value as "pending" | "disabled",
                  }))
                }
              >
                <option value="pending">Pendiente de conexión</option>
                <option value="disabled">Deshabilitada</option>
              </Select>
            </div>
          ) : null}
          {formError ? (
            <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIntegrationOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={
                createIntegration.isPending || updateIntegration.isPending
              }
              type="submit"
            >
              {createIntegration.isPending || updateIntegration.isPending
                ? "Guardando…"
                : "Guardar integración"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        description="La URL debe ser pública y aceptar solicitudes HTTPS o HTTP."
        onClose={() => setWebhookOpen(false)}
        open={webhookOpen}
        title={
          webhookId === null
            ? "Nuevo endpoint webhook"
            : "Editar endpoint webhook"
        }
      >
        <form
          className="space-y-4"
          onSubmit={(event) => void submitWebhook(event)}
        >
          <div>
            <Label htmlFor="webhook-name">Nombre</Label>
            <Input
              id="webhook-name"
              required
              value={webhookForm.name}
              onChange={(event) =>
                setWebhookForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="webhook-url">URL de destino</Label>
            <Input
              id="webhook-url"
              placeholder="https://tu-servicio.com/webhooks/vantex"
              required
              type="url"
              value={webhookForm.url}
              onChange={(event) =>
                setWebhookForm((current) => ({
                  ...current,
                  url: event.target.value,
                }))
              }
            />
            <p className="text-muted mt-1.5 text-xs">
              No se permiten localhost, IPs privadas ni URLs con credenciales.
            </p>
          </div>
          <div>
            <Label htmlFor="webhook-events">Eventos</Label>
            <Input
              id="webhook-events"
              placeholder="contact.created, deal.stage_changed"
              value={webhookForm.events}
              onChange={(event) =>
                setWebhookForm((current) => ({
                  ...current,
                  events: event.target.value,
                }))
              }
            />
          </div>
          <label className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <input
              checked={webhookForm.active}
              type="checkbox"
              onChange={(event) =>
                setWebhookForm((current) => ({
                  ...current,
                  active: event.target.checked,
                }))
              }
            />
            Endpoint activo
          </label>
          {formError ? (
            <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setWebhookOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={createWebhook.isPending || updateWebhook.isPending}
              type="submit"
            >
              {createWebhook.isPending || updateWebhook.isPending
                ? "Guardando…"
                : "Guardar endpoint"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function nonEmptyValues(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value.trim() !== ""),
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
