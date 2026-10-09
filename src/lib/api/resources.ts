import type { PaginationMeta, QueryParams } from "@/types/api";
import type {
  Activity,
  Automation,
  Contact,
  Deal,
  EntityDefinition,
  EntityRecord,
  ExportBatch,
  FieldDefinition,
  FileRecord,
  ImportBatch,
  Integration,
  IntegrationHealth,
  IntegrationProviderDefinition,
  Lead,
  Organization,
  Pipeline,
  Relation,
  RelationOptionGroup,
  Task,
  TenantInvitation,
  UserMembership,
  WebhookEndpoint,
  WebhookEndpointCreateResponse,
} from "@/types/domain";
import type { CustomerOverview } from "@/features/customer360/overview";
import type { TimelineEvent } from "@/features/customer360/timeline";
import type { SearchRecord } from "@/features/search/global-search";
import { apiClient } from "./client";

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export async function getPaginated<T>(
  path: string,
  query?: QueryParams,
): Promise<Paginated<T>> {
  const response = await apiClient.requestEnvelope<T[]>(path, {
    method: "GET",
    query,
  });
  return {
    items: response.data,
    meta: response.meta as unknown as PaginationMeta,
  };
}

export const crmApi = {
  search: (query: QueryParams) => getPaginated<SearchRecord>("search", query),
  contacts: {
    list: (query?: QueryParams) => getPaginated<Contact>("contacts", query),
    get: (id: number) => apiClient.get<Contact>(`contacts/${id}`),
    create: (body: unknown) => apiClient.post<Contact>("contacts", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<Contact>(`contacts/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`contacts/${id}`),
    // 10 is the most the API returns per module.
    overview: (id: number) =>
      apiClient.get<CustomerOverview>(`contacts/${id}/overview`, {
        recent_limit: 10,
      }),
    timeline: (id: number, page: number) =>
      getPaginated<TimelineEvent>(`contacts/${id}/timeline`, {
        page,
        per_page: 25,
      }),
  },
  organizations: {
    list: (query?: QueryParams) =>
      getPaginated<Organization>("organizations", query),
    get: (id: number) => apiClient.get<Organization>(`organizations/${id}`),
    create: (body: unknown) =>
      apiClient.post<Organization>("organizations", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<Organization>(`organizations/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`organizations/${id}`),
  },
  leads: {
    list: (query?: QueryParams) => getPaginated<Lead>("leads", query),
    get: (id: number) => apiClient.get<Lead>(`leads/${id}`),
    create: (body: unknown) => apiClient.post<Lead>("leads", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<Lead>(`leads/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`leads/${id}`),
    convert: (id: number, body: unknown) =>
      apiClient.post<{
        lead: Lead;
        contact?: Contact;
        organization?: Organization;
        deal?: Deal;
      }>(`leads/${id}/convert`, body),
  },
  deals: {
    list: (query?: QueryParams) => getPaginated<Deal>("deals", query),
    get: (id: number) => apiClient.get<Deal>(`deals/${id}`),
    create: (body: unknown) => apiClient.post<Deal>("deals", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<Deal>(`deals/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`deals/${id}`),
  },
  pipelines: {
    list: () => apiClient.get<Pipeline[]>("pipelines"),
    get: (id: number) => apiClient.get<Pipeline>(`pipelines/${id}`),
    create: (body: unknown) => apiClient.post<Pipeline>("pipelines", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<Pipeline>(`pipelines/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`pipelines/${id}`),
  },
  tasks: {
    list: (query?: QueryParams) => getPaginated<Task>("tasks", query),
    get: (id: number) => apiClient.get<Task>(`tasks/${id}`),
    create: (body: unknown) => apiClient.post<Task>("tasks", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<Task>(`tasks/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`tasks/${id}`),
  },
  activities: {
    list: (query?: QueryParams) => getPaginated<Activity>("activities", query),
    create: (body: unknown) => apiClient.post<Activity>("activities", body),
  },
  fields: {
    list: (entityType?: string, entityDefinitionId?: number) =>
      apiClient.get<FieldDefinition[]>(
        "field-definitions",
        entityDefinitionId
          ? { entity_definition_id: entityDefinitionId }
          : entityType
            ? { entity_type: entityType }
            : undefined,
      ),
    create: (body: unknown) =>
      apiClient.post<FieldDefinition>("field-definitions", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<FieldDefinition>(`field-definitions/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`field-definitions/${id}`),
  },
  entities: {
    list: () => apiClient.get<EntityDefinition[]>("entity-definitions"),
    get: (id: number) =>
      apiClient.get<EntityDefinition>(`entity-definitions/${id}`),
    create: (body: unknown) =>
      apiClient.post<EntityDefinition>("entity-definitions", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<EntityDefinition>(`entity-definitions/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`entity-definitions/${id}`),
    records: {
      list: (entityDefinitionId: number, query?: QueryParams) =>
        getPaginated<EntityRecord>(
          `entities/${entityDefinitionId}/records`,
          query,
        ),
      get: (entityDefinitionId: number, id: number) =>
        apiClient.get<EntityRecord>(
          `entities/${entityDefinitionId}/records/${id}`,
        ),
      create: (entityDefinitionId: number, body: unknown) =>
        apiClient.post<EntityRecord>(
          `entities/${entityDefinitionId}/records`,
          body,
        ),
      update: (entityDefinitionId: number, id: number, body: unknown) =>
        apiClient.patch<EntityRecord>(
          `entities/${entityDefinitionId}/records/${id}`,
          body,
        ),
      remove: (entityDefinitionId: number, id: number) =>
        apiClient.delete<{ deleted: boolean }>(
          `entities/${entityDefinitionId}/records/${id}`,
        ),
    },
  },
  relations: {
    list: (query?: QueryParams) => getPaginated<Relation>("relations", query),
    options: () => apiClient.get<RelationOptionGroup[]>("relations/options"),
    create: (body: unknown) => apiClient.post<Relation>("relations", body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`relations/${id}`),
  },
  automations: {
    list: () => apiClient.get<Automation[]>("automations"),
    get: (id: number) => apiClient.get<Automation>(`automations/${id}`),
    create: (body: unknown) => apiClient.post<Automation>("automations", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<Automation>(`automations/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`automations/${id}`),
  },
  integrations: {
    list: () => apiClient.get<Integration[]>("integrations"),
    providers: () =>
      apiClient.get<IntegrationProviderDefinition[]>("integrations/providers"),
    create: (body: unknown) =>
      apiClient.post<Integration>("integrations", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<Integration>(`integrations/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`integrations/${id}`),
    connect: (id: number) =>
      apiClient.post<Integration>(`integrations/${id}/connect`),
    disconnect: (id: number) =>
      apiClient.post<Integration>(`integrations/${id}/disconnect`),
    health: (id: number) =>
      apiClient.post<IntegrationHealth>(`integrations/${id}/health`),
  },
  webhooks: {
    list: () => apiClient.get<WebhookEndpoint[]>("webhooks/endpoints"),
    create: (body: unknown) =>
      apiClient.post<WebhookEndpointCreateResponse>("webhooks/endpoints", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<WebhookEndpoint>("webhooks/endpoints/" + id, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>("webhooks/endpoints/" + id),
  },
  users: {
    list: (query?: QueryParams) => getPaginated<UserMembership>("users", query),
    updateRole: (id: number, body: unknown) =>
      apiClient.patch<UserMembership>(`users/${id}/role`, body),
    invitations: {
      list: () => apiClient.get<TenantInvitation[]>("users/invitations"),
      create: async (body: unknown) => {
        const response = await apiClient.requestEnvelope<TenantInvitation>(
          "users/invitations",
          { method: "POST", body },
        );

        return {
          invitation: response.data,
          notificationSent: response.meta.notification_sent === true,
          acceptanceUrl:
            typeof response.meta.acceptance_url === "string"
              ? response.meta.acceptance_url
              : undefined,
        };
      },
      revoke: (id: number) =>
        apiClient.delete<{ revoked: boolean }>(`users/invitations/${id}`),
    },
  },
  roles: {
    list: () => apiClient.get<import("@/types/domain").Role[]>("roles"),
    create: (body: unknown) =>
      apiClient.post<import("@/types/domain").Role>("roles", body),
    update: (id: number, body: unknown) =>
      apiClient.patch<import("@/types/domain").Role>(`roles/${id}`, body),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`roles/${id}`),
  },
  files: {
    list: (query?: QueryParams) => getPaginated<FileRecord>("files", query),
    upload: (body: FormData) => apiClient.post<FileRecord>("files", body),
    download: (id: number) =>
      apiClient.get<{ url: string }>(`files/${id}/download`),
    remove: (id: number) =>
      apiClient.delete<{ deleted: boolean }>(`files/${id}`),
  },
  imports: {
    create: (body: FormData) => apiClient.post<ImportBatch>("imports", body),
    get: (id: number) => apiClient.get<ImportBatch>(`imports/${id}`),
  },
  exports: {
    create: (body: unknown) => apiClient.post<ExportBatch>("exports", body),
    get: (id: number) => apiClient.get<ExportBatch>(`exports/${id}`),
  },
};
