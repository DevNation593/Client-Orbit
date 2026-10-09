import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import { RecordTags } from "./record-tags";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const page = (data: unknown[]) => ({
  data,
  meta: {
    current_page: 1,
    from: data.length ? 1 : null,
    last_page: 1,
    per_page: 50,
    to: data.length || null,
    total: data.length,
  },
});

/** In-memory tags API: a catalog plus the assignments of contact 7. */
function stubApi() {
  const tags = [
    { id: 1, name: "VIP", color: "#112233", description: null },
    { id: 2, name: "Moroso", color: null, description: null },
  ];
  const assignments = [{ id: 55, tag_id: 1 }];
  const requested: Array<{ call: string; body?: unknown }> = [];
  let nextTagId = 3;
  let nextAssignmentId = 56;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const path = url.replace("/api/backend/", "");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requested.push({ call: method + " " + path, body });

      if (method === "GET" && path.startsWith("tags?")) {
        const assigned = path.includes("entity_type=contact&entity_id=7");
        return json(
          page(
            assigned
              ? tags.filter((tag) =>
                  assignments.some((entry) => entry.tag_id === tag.id),
                )
              : tags,
          ),
        );
      }
      if (method === "POST" && path === "tags") {
        const tag = {
          id: nextTagId++,
          name: body.name,
          color: null,
          description: null,
        };
        tags.push(tag);
        return json({ data: tag, meta: {} }, 201);
      }
      const assign = path.match(/^tags\/(\d+)\/assignments$/);
      if (method === "POST" && assign) {
        const tagId = Number(assign[1]);
        let assignment = assignments.find((entry) => entry.tag_id === tagId);
        const created = !assignment;
        if (!assignment) {
          assignment = { id: nextAssignmentId++, tag_id: tagId };
          assignments.push(assignment);
        }
        return json(
          {
            data: {
              ...assignment,
              taggable_type: "contact",
              taggable_id: 7,
              tag: tags.find((tag) => tag.id === tagId),
            },
            meta: { created },
          },
          created ? 201 : 200,
        );
      }
      const unassign = path.match(/^tags\/(\d+)\/assignments\/(\d+)$/);
      if (method === "DELETE" && unassign) {
        const index = assignments.findIndex(
          (entry) => entry.id === Number(unassign[2]),
        );
        if (index < 0) return json({ message: "Not found", errors: {} }, 404);
        assignments.splice(index, 1);
        return json({ data: { deleted: true }, meta: {} });
      }
      return json({ message: "Not found", errors: {} }, 404);
    }),
  );
  return requested;
}

function renderTags() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <RecordTags entityId={7} entityType="contact" />
    </QueryClientProvider>,
  );
}

function signIn(permissions: string[]) {
  useAuthStore.setState({
    user: { id: 1, name: "Admin", email: "admin@example.com", permissions },
    tenant: { id: 1, name: "Demo" },
    tenants: [],
    ready: true,
    loading: false,
  });
}

async function tagList() {
  return within(await screen.findByRole("list", { name: "Etiquetas" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RecordTags", () => {
  it("shows the tags assigned to the record", async () => {
    signIn(["tags.view", "tags.manage"]);
    stubApi();
    renderTags();

    expect(await (await tagList()).findByText("VIP")).toBeInTheDocument();
    expect((await tagList()).queryByText("Moroso")).not.toBeInTheDocument();
  });

  it("assigns an existing tag by name, whatever its capitalization", async () => {
    signIn(["tags.view", "tags.manage"]);
    const requested = stubApi();
    renderTags();
    await (await tagList()).findByText("VIP");

    await userEvent.type(screen.getByLabelText("Añadir etiqueta"), "moroso");
    await userEvent.click(screen.getByRole("button", { name: "Añadir" }));

    expect(await (await tagList()).findByText("Moroso")).toBeInTheDocument();
    expect(requested).toContainEqual({
      call: "POST tags/2/assignments",
      body: { entity_type: "contact", entity_id: 7 },
    });
    expect(requested.map((entry) => entry.call)).not.toContain("POST tags");
    expect(screen.getByLabelText("Añadir etiqueta")).toHaveValue("");
  });

  it("creates the tag first when no tag has that name", async () => {
    signIn(["tags.view", "tags.manage"]);
    const requested = stubApi();
    renderTags();
    await (await tagList()).findByText("VIP");

    await userEvent.type(
      screen.getByLabelText("Añadir etiqueta"),
      "  Referido  ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Añadir" }));

    expect(await (await tagList()).findByText("Referido")).toBeInTheDocument();
    expect(requested).toContainEqual({
      call: "POST tags",
      body: { name: "Referido" },
    });
    expect(requested).toContainEqual({
      call: "POST tags/3/assignments",
      body: { entity_type: "contact", entity_id: 7 },
    });
  });

  it("removes a tag from the record", async () => {
    signIn(["tags.view", "tags.manage"]);
    const requested = stubApi();
    renderTags();

    await userEvent.click(
      await screen.findByRole("button", { name: "Quitar etiqueta VIP" }),
    );

    expect(
      await screen.findByText("Sin etiquetas todavía."),
    ).toBeInTheDocument();
    expect(requested.map((entry) => entry.call)).toContain(
      "DELETE tags/1/assignments/55",
    );
  });

  it("is read-only for users who cannot manage tags", async () => {
    signIn(["tags.view"]);
    stubApi();
    renderTags();

    expect(await (await tagList()).findByText("VIP")).toBeInTheDocument();
    expect(screen.queryByLabelText("Añadir etiqueta")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar etiqueta VIP" }),
    ).not.toBeInTheDocument();
  });

  it("is not shown to users who cannot see tags", async () => {
    signIn(["contacts.view"]);
    const requested = stubApi();
    renderTags();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryByText("Etiquetas")).not.toBeInTheDocument();
    expect(requested).toEqual([]);
  });

  it("explains why a tag could not be added", async () => {
    signIn(["tags.view", "tags.manage"]);
    stubApi();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) =>
        (init?.method ?? "GET") === "GET"
          ? json(page([]))
          : json(
              {
                message: "Validation failed.",
                errors: { name: ["A tag with this name already exists."] },
              },
              422,
            ),
      ),
    );
    renderTags();
    await screen.findByText("Sin etiquetas todavía.");

    await userEvent.type(screen.getByLabelText("Añadir etiqueta"), "VIP");
    await userEvent.click(screen.getByRole("button", { name: "Añadir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A tag with this name already exists.",
    );
  });
});
