"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "@/lib/api/resources";

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: crmApi.integrations.list,
  });
}
export function useIntegrationProviders() {
  return useQuery({
    queryKey: ["integration-providers"],
    queryFn: crmApi.integrations.providers,
  });
}
export function useCreateIntegration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: crmApi.integrations.create,
    onSuccess: () => client.invalidateQueries({ queryKey: ["integrations"] }),
  });
}
export function useUpdateIntegration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) =>
      crmApi.integrations.update(id, body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["integrations"] }),
  });
}
export function useConnectIntegration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: crmApi.integrations.connect,
    onSuccess: () => client.invalidateQueries({ queryKey: ["integrations"] }),
  });
}
export function useDisconnectIntegration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: crmApi.integrations.disconnect,
    onSuccess: () => client.invalidateQueries({ queryKey: ["integrations"] }),
  });
}
export function useIntegrationHealth() {
  return useMutation({ mutationFn: crmApi.integrations.health });
}
export function useDeleteIntegration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: crmApi.integrations.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export function useWebhookEndpoints() {
  return useQuery({
    queryKey: ["webhook-endpoints"],
    queryFn: crmApi.webhooks.list,
  });
}

export function useCreateWebhookEndpoint() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: crmApi.webhooks.create,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["webhook-endpoints"] }),
  });
}

export function useUpdateWebhookEndpoint() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) =>
      crmApi.webhooks.update(id, body),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["webhook-endpoints"] }),
  });
}

export function useDeleteWebhookEndpoint() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: crmApi.webhooks.remove,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["webhook-endpoints"] }),
  });
}
