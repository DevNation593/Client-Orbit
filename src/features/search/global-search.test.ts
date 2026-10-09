import { afterEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/types/domain";
import { ApiError } from "@/lib/api/error";
import {
  fetchGlobalSearch,
  groupSearchResults,
  type SearchRecord,
} from "./global-search";

const records: SearchRecord[] = [
  {
    type: "contact",
    id: 4,
    title: "Ana Pérez",
    subtitle: "ana@example.com",
    relevance: 80,
    updated_at: "2026-10-01T10:00:00.000000Z",
  },
  {
    type: "company",
    id: 9,
    title: "Anaconda SA",
    subtitle: null,
    relevance: 80,
    updated_at: "2026-10-01T09:00:00.000000Z",
  },
  {
    type: "lead",
    id: 3,
    title: "Anabel Ruiz",
    subtitle: "web",
    relevance: 80,
    updated_at: "2026-09-30T10:00:00.000000Z",
  },
  {
    type: "opportunity",
    id: 12,
    title: "Renovación Anaconda",
    subtitle: "USD 1500.00",
    relevance: 60,
    updated_at: "2026-09-29T10:00:00.000000Z",
  },
  {
    type: "document",
    id: 21,
    title: "contrato-ana.pdf",
    subtitle: "application/pdf",
    relevance: 60,
    updated_at: "2026-09-28T10:00:00.000000Z",
  },
  {
    type: "custom_object",
    id: 31,
    title: "Casa Ana",
    subtitle: "Propiedad",
    relevance: 60,
    updated_at: "2026-09-27T10:00:00.000000Z",
    entity_definition_id: 2,
  },
];

const task: Task = {
  id: 8,
  title: "Llamar a Ana",
  status: "pending",
  priority: "normal",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const paginationMeta = {
  current_page: 1,
  from: 1,
  last_page: 1,
  per_page: 25,
  to: 1,
  total: 1,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("groupSearchResults", () => {
  it("groups API records by module with links to each record", () => {
    expect(groupSearchResults(records, [task])).toEqual([
      {
        kind: "contact",
        label: "Contactos",
        results: [
          {
            id: 4,
            kind: "contact",
            label: "Ana Pérez",
            description: "ana@example.com",
            href: "/contacts/4",
          },
        ],
      },
      {
        kind: "organization",
        label: "Organizaciones",
        results: [
          {
            id: 9,
            kind: "organization",
            label: "Anaconda SA",
            description: undefined,
            href: "/organizations/9",
          },
        ],
      },
      {
        kind: "lead",
        label: "Leads",
        results: [
          {
            id: 3,
            kind: "lead",
            label: "Anabel Ruiz",
            description: "web",
            href: "/leads/3",
          },
        ],
      },
      {
        kind: "deal",
        label: "Oportunidades",
        results: [
          {
            id: 12,
            kind: "deal",
            label: "Renovación Anaconda",
            description: "USD 1500.00",
            href: "/deals/12",
          },
        ],
      },
      {
        kind: "task",
        label: "Tareas",
        results: [
          {
            id: 8,
            kind: "task",
            label: "Llamar a Ana",
            description: "pending",
            href: "/tasks/8",
          },
        ],
      },
      {
        kind: "document",
        label: "Documentos",
        results: [
          {
            id: 21,
            kind: "document",
            label: "contrato-ana.pdf",
            description: "application/pdf",
            href: "/files",
          },
        ],
      },
      {
        kind: "custom_object",
        label: "Registros personalizados",
        results: [
          {
            id: 31,
            kind: "custom_object",
            label: "Casa Ana",
            description: "Propiedad",
            href: "/entities/2/31",
          },
        ],
      },
    ]);
  });

  it("omits modules without results", () => {
    const groups = groupSearchResults([records[0]!], []);

    expect(groups.map((group) => group.kind)).toEqual(["contact"]);
  });

  it("keeps the API ranking and shows at most five results per module", () => {
    const contacts: SearchRecord[] = [1, 2, 3, 4, 5, 6].map((id) => ({
      type: "contact",
      id,
      title: "Ana " + id,
      subtitle: null,
      relevance: 80,
      updated_at: null,
    }));

    const groups = groupSearchResults(contacts, []);

    expect(groups[0]?.results.map((result) => result.id)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });
});

describe("fetchGlobalSearch", () => {
  it("asks the search endpoint once and the task list for the same term", async () => {
    const requested: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        requested.push(url);
        return url.startsWith("/api/backend/search")
          ? jsonResponse({ data: [records[0]], meta: paginationMeta })
          : jsonResponse({ data: [task], meta: paginationMeta });
      }),
    );

    const result = await fetchGlobalSearch("ana pérez");

    expect(requested.sort()).toEqual([
      "/api/backend/search?q=ana+p%C3%A9rez&per_page=25",
      "/api/backend/tasks?search=ana+p%C3%A9rez&per_page=5",
    ]);
    expect(result.partial).toBe(false);
    expect(result.groups.map((group) => group.kind)).toEqual([
      "contact",
      "task",
    ]);
  });

  it("still returns tasks and flags the result as partial when search is forbidden", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.startsWith("/api/backend/search")
          ? jsonResponse(
              {
                message: "You do not have permission to use global search.",
                errors: {},
              },
              403,
            )
          : jsonResponse({ data: [task], meta: paginationMeta }),
      ),
    );

    const result = await fetchGlobalSearch("ana");

    expect(result.partial).toBe(true);
    expect(result.groups.map((group) => group.kind)).toEqual(["task"]);
  });

  it("fails when neither search nor tasks can be queried", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ message: "Server Error", errors: {} }, 500),
      ),
    );

    await expect(fetchGlobalSearch("ana")).rejects.toBeInstanceOf(ApiError);
  });
});
