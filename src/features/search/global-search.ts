import { crmApi } from "@/lib/api/resources";
import type { Task } from "@/types/domain";

export type GlobalSearchKind =
  | "contact"
  | "organization"
  | "lead"
  | "deal"
  | "task"
  | "document"
  | "custom_object";

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

/** One row of `GET /search`, as produced by the API's GlobalSearchService. */
export interface SearchRecord {
  type:
    | "contact"
    | "company"
    | "lead"
    | "opportunity"
    | "document"
    | "custom_object";
  id: number;
  title: string;
  subtitle: string | null;
  relevance: number;
  updated_at: string | null;
  entity_definition_id?: number;
}

export interface GlobalSearchData {
  groups: GlobalSearchGroup[];
  partial: boolean;
}

const RESULTS_PER_GROUP = 5;

const groupOrder: Array<{ kind: GlobalSearchKind; label: string }> = [
  { kind: "contact", label: "Contactos" },
  { kind: "organization", label: "Organizaciones" },
  { kind: "lead", label: "Leads" },
  { kind: "deal", label: "Oportunidades" },
  { kind: "task", label: "Tareas" },
  { kind: "document", label: "Documentos" },
  { kind: "custom_object", label: "Registros personalizados" },
];

function toResult(record: SearchRecord): GlobalSearchResult {
  const base = {
    id: record.id,
    label: record.title,
    description: record.subtitle ?? undefined,
  };
  switch (record.type) {
    case "contact":
      return { ...base, kind: "contact", href: "/contacts/" + record.id };
    case "company":
      return {
        ...base,
        kind: "organization",
        href: "/organizations/" + record.id,
      };
    case "lead":
      return { ...base, kind: "lead", href: "/leads/" + record.id };
    case "opportunity":
      return { ...base, kind: "deal", href: "/deals/" + record.id };
    case "document":
      // Files have no detail page; the list is the closest destination.
      return { ...base, kind: "document", href: "/files" };
    case "custom_object":
      return {
        ...base,
        kind: "custom_object",
        href: "/entities/" + record.entity_definition_id + "/" + record.id,
      };
  }
}

export function groupSearchResults(
  records: SearchRecord[],
  tasks: Task[],
): GlobalSearchGroup[] {
  const results: GlobalSearchResult[] = [
    ...records.map(toResult),
    ...tasks.map((task) => ({
      id: task.id,
      kind: "task" as const,
      label: task.title,
      description: task.status,
      href: "/tasks/" + task.id,
    })),
  ];

  return groupOrder
    .map((group) => ({
      ...group,
      results: results
        .filter((result) => result.kind === group.kind)
        .slice(0, RESULTS_PER_GROUP),
    }))
    .filter((group) => group.results.length > 0);
}

/**
 * `GET /search` ranks contacts, companies, leads, opportunities, documents
 * and custom records server-side. Tasks are not part of that endpoint, so
 * they are still queried from their own list.
 */
export async function fetchGlobalSearch(
  query: string,
): Promise<GlobalSearchData> {
  const [records, tasks] = await Promise.allSettled([
    crmApi.search({ q: query, per_page: 25 }),
    crmApi.tasks.list({ search: query, per_page: RESULTS_PER_GROUP }),
  ]);
  if (records.status === "rejected" && tasks.status === "rejected")
    throw records.reason;

  return {
    groups: groupSearchResults(
      records.status === "fulfilled" ? records.value.items : [],
      tasks.status === "fulfilled" ? tasks.value.items : [],
    ),
    partial: records.status === "rejected" || tasks.status === "rejected",
  };
}
