"use client";

import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/lib/api/resources";
import type { Lead } from "@/types/domain";

export type GlobalSearchKind =
  | "contact"
  | "organization"
  | "lead"
  | "deal"
  | "task";

export interface GlobalSearchResult {
  id: number;
  kind: GlobalSearchKind;
  label: string;
  description?: string;
  href: string;
}

export interface GlobalSearchGroup {
  kind: GlobalSearchKind;
  label: string;
  results: GlobalSearchResult[];
}

export function useGlobalSearch(value: string) {
  const query = value.trim();
  return useQuery({
    queryKey: ["global-search", query],
    enabled: query.length >= 2,
    staleTime: 10_000,
    queryFn: async () => {
      const responses = await Promise.allSettled([
        crmApi.contacts.list({ search: query, per_page: 5 }),
        crmApi.organizations.list({ search: query, per_page: 5 }),
        crmApi.leads.list({ search: query, per_page: 5 }),
        crmApi.deals.list({ search: query, per_page: 5 }),
        crmApi.tasks.list({ search: query, per_page: 5 }),
      ]);

      const contacts =
        responses[0].status === "fulfilled"
          ? responses[0].value.items.map((contact) => ({
              id: contact.id,
              kind: "contact" as const,
              label:
                (contact.first_name + " " + (contact.last_name ?? "")).trim() ||
                "Contacto sin nombre",
              description: contact.email ?? contact.phone ?? undefined,
              href: "/contacts/" + contact.id,
            }))
          : [];
      const organizations =
        responses[1].status === "fulfilled"
          ? responses[1].value.items.map((organization) => ({
              id: organization.id,
              kind: "organization" as const,
              label: organization.name,
              description:
                organization.email ?? organization.website ?? undefined,
              href: "/organizations/" + organization.id,
            }))
          : [];
      const leads =
        responses[2].status === "fulfilled"
          ? responses[2].value.items.map((lead) => ({
              id: lead.id,
              kind: "lead" as const,
              label: leadLabel(lead),
              description: lead.email ?? lead.source ?? undefined,
              href: "/leads/" + lead.id,
            }))
          : [];
      const deals =
        responses[3].status === "fulfilled"
          ? responses[3].value.items.map((deal) => ({
              id: deal.id,
              kind: "deal" as const,
              label: deal.name,
              description: deal.pipeline?.name ?? deal.stage?.name ?? undefined,
              href: "/deals/" + deal.id,
            }))
          : [];
      const tasks =
        responses[4].status === "fulfilled"
          ? responses[4].value.items.map((task) => ({
              id: task.id,
              kind: "task" as const,
              label: task.title,
              description: task.status,
              href: "/tasks/" + task.id,
            }))
          : [];

      const groups: GlobalSearchGroup[] = [
        { kind: "contact", label: "Contactos", results: contacts },
        {
          kind: "organization",
          label: "Organizaciones",
          results: organizations,
        },
        { kind: "lead", label: "Leads", results: leads },
        { kind: "deal", label: "Oportunidades", results: deals },
        { kind: "task", label: "Tareas", results: tasks },
      ];

      return {
        groups: groups.filter((group) => group.results.length > 0),
        failed: responses.filter((response) => response.status === "rejected")
          .length,
      };
    },
  });
}

function leadLabel(lead: Lead) {
  return (
    ((lead.first_name ?? "") + " " + (lead.last_name ?? "")).trim() ||
    lead.email ||
    "Lead sin nombre"
  );
}
