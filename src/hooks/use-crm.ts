"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "@/lib/api/resources";
import type { QueryParams } from "@/types/api";

export const queryKeys = {
  contacts: (query?: QueryParams) => ["contacts", query ?? {}] as const,
  contact: (id: number) => ["contacts", id] as const,
  organizations: (query?: QueryParams) =>
    ["organizations", query ?? {}] as const,
  organization: (id: number) => ["organizations", id] as const,
  leads: (query?: QueryParams) => ["leads", query ?? {}] as const,
  lead: (id: number) => ["leads", id] as const,
  deals: (query?: QueryParams) => ["deals", query ?? {}] as const,
  deal: (id: number) => ["deals", id] as const,
  pipelines: ["pipelines"] as const,
  tasks: (query?: QueryParams) => ["tasks", query ?? {}] as const,
  task: (id: number) => ["tasks", id] as const,
  files: (query?: QueryParams) => ["files", query ?? {}] as const,
  activities: (query?: QueryParams) => ["activities", query ?? {}] as const,
  fields: (entityType?: string) =>
    ["field-definitions", entityType ?? "all"] as const,
  entities: ["entity-definitions"] as const,
  entity: (id: number) => ["entity", id] as const,
  entityRecords: (id: number, query?: QueryParams) =>
    ["entity-records", id, query ?? {}] as const,
  automations: ["automations"] as const,
  integrations: ["integrations"] as const,
  users: (query?: QueryParams) => ["users", query ?? {}] as const,
  invitations: ["user-invitations"] as const,
  roles: ["roles"] as const,
  relations: (query?: QueryParams) => ["relations", query ?? {}] as const,
  relationOptions: ["relation-options"] as const,
};

export function useContacts(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.contacts(query),
    queryFn: () => crmApi.contacts.list(query),
  });
}
export function useContact(id: number) {
  return useQuery({
    queryKey: queryKeys.contact(id),
    queryFn: () => crmApi.contacts.get(id),
    enabled: Number.isFinite(id),
  });
}
export function useOrganizations(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.organizations(query),
    queryFn: () => crmApi.organizations.list(query),
  });
}
export function useOrganization(id: number) {
  return useQuery({
    queryKey: queryKeys.organization(id),
    queryFn: () => crmApi.organizations.get(id),
    enabled: Number.isFinite(id),
  });
}
export function useLeads(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.leads(query),
    queryFn: () => crmApi.leads.list(query),
  });
}
export function useLead(id: number) {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn: () => crmApi.leads.get(id),
    enabled: Number.isFinite(id),
  });
}
export function useDeals(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.deals(query),
    queryFn: () => crmApi.deals.list(query),
  });
}
export function useDeal(id: number) {
  return useQuery({
    queryKey: queryKeys.deal(id),
    queryFn: () => crmApi.deals.get(id),
    enabled: Number.isFinite(id),
  });
}
export function usePipelines() {
  return useQuery({
    queryKey: queryKeys.pipelines,
    queryFn: crmApi.pipelines.list,
  });
}
export function useTasks(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.tasks(query),
    queryFn: () => crmApi.tasks.list(query),
  });
}
export function useTask(id: number) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => crmApi.tasks.get(id),
    enabled: Number.isFinite(id),
  });
}
export function useFiles(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.files(query),
    queryFn: () => crmApi.files.list(query),
  });
}
export function useActivities(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.activities(query),
    queryFn: () => crmApi.activities.list(query),
  });
}
export function useFieldDefinitions(
  entityType?: string,
  entityDefinitionId?: number,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.fields(entityType),
      entityDefinitionId ?? "all-custom",
    ],
    queryFn: () => crmApi.fields.list(entityType, entityDefinitionId),
  });
}
export function useEntityDefinitions() {
  return useQuery({
    queryKey: queryKeys.entities,
    queryFn: crmApi.entities.list,
  });
}
export function useEntityDefinition(id: number) {
  const query = useEntityDefinitions();
  return { ...query, data: query.data?.find((entity) => entity.id === id) };
}
export function useEntityRecords(id: number, query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.entityRecords(id, query),
    queryFn: () => crmApi.entities.records.list(id, query),
    enabled: Number.isFinite(id) && id > 0,
  });
}
export function useAutomations() {
  return useQuery({
    queryKey: queryKeys.automations,
    queryFn: crmApi.automations.list,
  });
}
export function useIntegrations() {
  return useQuery({
    queryKey: queryKeys.integrations,
    queryFn: crmApi.integrations.list,
  });
}
export function useUsers(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.users(query),
    queryFn: () => crmApi.users.list(query),
  });
}
export function useUpdateUserRole() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.users.updateRole(id, body),
    ["users"],
  );
}
export function useInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations,
    queryFn: crmApi.users.invitations.list,
  });
}
export function useInviteUser() {
  return useInvalidateMutation(crmApi.users.invitations.create, [
    "user-invitations",
  ]);
}
export function useRevokeInvitation() {
  return useInvalidateMutation(crmApi.users.invitations.revoke, [
    "user-invitations",
  ]);
}
export function useRoles() {
  return useQuery({ queryKey: queryKeys.roles, queryFn: crmApi.roles.list });
}
export function useRelations(query?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.relations(query),
    queryFn: () => crmApi.relations.list(query),
  });
}
export function useRelationOptions() {
  return useQuery({
    queryKey: queryKeys.relationOptions,
    queryFn: crmApi.relations.options,
  });
}
export function useCreateRelation() {
  return useInvalidateMutation(crmApi.relations.create, ["relations"]);
}
export function useDeleteRelation() {
  return useInvalidateMutation(crmApi.relations.remove, ["relations"]);
}

export function useCreateContact() {
  return useInvalidateMutation(crmApi.contacts.create, ["contacts"]);
}
export function useUpdateContact() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.contacts.update(id, body),
    ["contacts"],
  );
}
export function useDeleteContact() {
  return useInvalidateMutation(crmApi.contacts.remove, ["contacts"]);
}
export function useCreateOrganization() {
  return useInvalidateMutation(crmApi.organizations.create, ["organizations"]);
}
export function useUpdateOrganization() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.organizations.update(id, body),
    ["organizations"],
  );
}
export function useDeleteOrganization() {
  return useInvalidateMutation(crmApi.organizations.remove, ["organizations"]);
}
export function useCreateLead() {
  return useInvalidateMutation(crmApi.leads.create, ["leads"]);
}
export function useUpdateLead() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.leads.update(id, body),
    ["leads"],
  );
}
export function useDeleteLead() {
  return useInvalidateMutation(crmApi.leads.remove, ["leads"]);
}
export function useConvertLead() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.leads.convert(id, body),
    ["leads", "deals", "contacts", "organizations"],
  );
}
export function useCreateDeal() {
  return useInvalidateMutation(crmApi.deals.create, ["deals"]);
}
export function useUpdateDeal() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.deals.update(id, body),
    ["deals"],
  );
}
export function useDeleteDeal() {
  return useInvalidateMutation(crmApi.deals.remove, ["deals"]);
}
export function useCreatePipeline() {
  return useInvalidateMutation(crmApi.pipelines.create, ["pipelines"]);
}
export function useUpdatePipeline() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.pipelines.update(id, body),
    ["pipelines"],
  );
}
export function useDeletePipeline() {
  return useInvalidateMutation(crmApi.pipelines.remove, ["pipelines"]);
}
export function useCreateTask() {
  return useInvalidateMutation(crmApi.tasks.create, ["tasks"]);
}
export function useUpdateTask() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.tasks.update(id, body),
    ["tasks"],
  );
}
export function useDeleteTask() {
  return useInvalidateMutation(crmApi.tasks.remove, ["tasks"]);
}
export function useCreateActivity() {
  return useInvalidateMutation(crmApi.activities.create, ["activities"]);
}
export function useCreateField() {
  return useInvalidateMutation(crmApi.fields.create, ["field-definitions"]);
}
export function useUpdateField() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.fields.update(id, body),
    ["field-definitions", "entity-definitions"],
  );
}
export function useDeleteField() {
  return useInvalidateMutation(crmApi.fields.remove, [
    "field-definitions",
    "entity-definitions",
  ]);
}
export function useCreateEntity() {
  return useInvalidateMutation(crmApi.entities.create, ["entity-definitions"]);
}
export function useUpdateEntity() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.entities.update(id, body),
    ["entity-definitions"],
  );
}
export function useDeleteEntity() {
  return useInvalidateMutation(crmApi.entities.remove, ["entity-definitions"]);
}
export function useCreateEntityRecord() {
  return useInvalidateMutation(
    ({
      entityDefinitionId,
      body,
    }: {
      entityDefinitionId: number;
      body: unknown;
    }) => crmApi.entities.records.create(entityDefinitionId, body),
    ["entity-records"],
  );
}
export function useUpdateEntityRecord() {
  return useInvalidateMutation(
    ({
      entityDefinitionId,
      id,
      body,
    }: {
      entityDefinitionId: number;
      id: number;
      body: unknown;
    }) => crmApi.entities.records.update(entityDefinitionId, id, body),
    ["entity-records"],
  );
}
export function useDeleteEntityRecord() {
  return useInvalidateMutation(
    ({ entityDefinitionId, id }: { entityDefinitionId: number; id: number }) =>
      crmApi.entities.records.remove(entityDefinitionId, id),
    ["entity-records"],
  );
}
export function useCreateAutomation() {
  return useInvalidateMutation(crmApi.automations.create, ["automations"]);
}
export function useUpdateAutomation() {
  return useInvalidateMutation(
    ({ id, body }: { id: number; body: unknown }) =>
      crmApi.automations.update(id, body),
    ["automations"],
  );
}
export function useDeleteAutomation() {
  return useInvalidateMutation(crmApi.automations.remove, ["automations"]);
}

function useInvalidateMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  namespaces: string[],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(
        namespaces.map((namespace) =>
          queryClient.invalidateQueries({ queryKey: [namespace] }),
        ),
      );
    },
  });
}
