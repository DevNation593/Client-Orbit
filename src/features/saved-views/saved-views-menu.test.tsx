import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import type { SavedView } from "./saved-views";
import { SavedViewsMenu } from "./saved-views-menu";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function seed(): SavedView[] {
  return [
    {
      id: 1,
      entity_type: "contacts",
      name: "Prospectos",
      visibility: "private",
      sort_field: null,
      sort_direction: null,
      columns: ["name", "status"],
      is_default: false,
      user_id: 1,
      owner: { id: 1, name: "Admin" },
      filters: [{ field: "status", operator: "eq", value: "prospect" }],
    },
    {
      id: 2,
      entity_type: "contacts",
      name: "Clientes del equipo",
      visibility: "tenant",
      sort_field: null,
      sort_direction: null,
      columns: null,
      is_default: false,
      user_id: 99,
      owner: { id: 99, name: "Otra persona" },
      filters: [{ field: "status", operator: "eq", value: "active" }],
    },
  ];
}

/** In-memory saved views API. */
function stubApi(options: { duplicateName?: boolean } = {}) {
  const views = seed();
  const requested: Array<{ call: string; body?: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const path = url.replace("/api/backend/", "");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requested.push({ call: method + " " + path, body });
      if (method === "GET" && path.startsWith("saved-views?"))
        return json({
          data: views,
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: 50,
            to: views.length,
            total: views.length,
          },
        });
      if (method === "POST" && path === "saved-views") {
        if (options.duplicateName)
          return json(
            {
              message: "Validation failed.",
              errors: { name: ["You already have a view with this name."] },
            },
            422,
          );
        const created: SavedView = {
          id: 3,
          sort_field: null,
          sort_direction: null,
          is_default: false,
          user_id: 1,
          owner: { id: 1, name: "Admin" },
          ...body,
        };
        views.push(created);
        return json({ data: created, meta: {} }, 201);
      }
      const remove = path.match(/^saved-views\/(\d+)$/);
      if (method === "PATCH" && remove) {
        const view = views.find((entry) => entry.id === Number(remove[1]));
        if (!view) return json({ message: "Not found", errors: {} }, 404);
        Object.assign(view, body);
        return json({ data: view, meta: {} });
      }
      if (method === "DELETE" && remove) {
        views.splice(
          views.findIndex((view) => view.id === Number(remove[1])),
          1,
        );
        return json({ data: { deleted: true }, meta: {} });
      }
      return json({ message: "Not found", errors: {} }, 404);
    }),
  );
  return requested;
}

function renderMenu(onApply: (view: SavedView | null) => void = () => {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SavedViewsMenu
        columnVisibility={{ phone: false }}
        columns={["name", "phone", "status"]}
        entityType="contacts"
        filters={[{ field: "status", operator: "eq", value: "inactive" }]}
        onApply={onApply}
        sort={{ field: "first_name", direction: "desc" }}
      />
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SavedViewsMenu", () => {
  it("offers the views of this list and hands over the chosen one", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    const requested = stubApi();
    const applied: Array<SavedView | null> = [];
    renderMenu((view) => applied.push(view));

    await screen.findByRole("option", { name: "Prospectos" });
    await userEvent.selectOptions(
      screen.getByLabelText("Vista guardada"),
      "Prospectos",
    );

    expect(requested[0]?.call).toBe(
      "GET saved-views?entity_type=contacts&per_page=50",
    );
    expect(applied).toEqual([seed()[0]]);
  });

  it("goes back to no view", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    stubApi();
    const applied: Array<SavedView | null> = [];
    renderMenu((view) => applied.push(view));
    await screen.findByRole("option", { name: "Prospectos" });
    await userEvent.selectOptions(
      screen.getByLabelText("Vista guardada"),
      "Prospectos",
    );

    await userEvent.selectOptions(
      screen.getByLabelText("Vista guardada"),
      "Sin vista",
    );

    expect(applied.at(-1)).toBeNull();
  });

  it("saves the current filters and visible columns as a new view and selects it", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    const requested = stubApi();
    renderMenu();
    await screen.findByRole("option", { name: "Prospectos" });

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar vista" }),
    );
    await userEvent.type(
      screen.getByLabelText("Nombre de la vista"),
      "Inactivos",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByRole("option", { name: "Inactivos" }),
    ).toBeInTheDocument();
    expect(requested).toContainEqual({
      call: "POST saved-views",
      body: {
        entity_type: "contacts",
        name: "Inactivos",
        visibility: "private",
        sort_field: "first_name",
        sort_direction: "desc",
        columns: ["name", "status"],
        filters: [{ field: "status", operator: "eq", value: "inactive" }],
      },
    });
    await vi.waitFor(() =>
      expect(screen.getByLabelText("Vista guardada")).toHaveDisplayValue(
        "Inactivos",
      ),
    );
  });

  it("shares a new view with the whole organization when asked to", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    const requested = stubApi();
    renderMenu();
    await screen.findByRole("option", { name: "Prospectos" });

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar vista" }),
    );
    await userEvent.type(
      screen.getByLabelText("Nombre de la vista"),
      "Inactivos",
    );
    await userEvent.selectOptions(
      screen.getByLabelText("Quién puede ver la vista"),
      "Toda la organización",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await screen.findByRole("option", { name: "Inactivos" });
    expect(
      requested.find((entry) => entry.call === "POST saved-views")?.body,
    ).toMatchObject({ name: "Inactivos", visibility: "tenant" });
  });

  it("changes who an existing view of the user is shared with", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    const requested = stubApi();
    renderMenu();
    await screen.findByRole("option", { name: "Prospectos" });
    await userEvent.selectOptions(
      screen.getByLabelText("Vista guardada"),
      "Prospectos",
    );

    await userEvent.selectOptions(
      screen.getByLabelText("Compartir vista Prospectos"),
      "Mi rol",
    );

    await vi.waitFor(() =>
      expect(requested).toContainEqual({
        call: "PATCH saved-views/1",
        body: { visibility: "team" },
      }),
    );
    await vi.waitFor(() =>
      expect(
        screen.getByLabelText("Compartir vista Prospectos"),
      ).toHaveDisplayValue("Mi rol"),
    );
  });

  it("says who shared a view that belongs to someone else", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    stubApi();
    renderMenu();
    await screen.findByRole("option", { name: "Clientes del equipo" });

    await userEvent.selectOptions(
      screen.getByLabelText("Vista guardada"),
      "Clientes del equipo",
    );

    expect(screen.getByText("Compartida por Otra persona")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Compartir vista/)).not.toBeInTheDocument();
  });

  it("deletes a view the user owns", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    const requested = stubApi();
    const applied: Array<SavedView | null> = [];
    renderMenu((view) => applied.push(view));
    await screen.findByRole("option", { name: "Prospectos" });
    await userEvent.selectOptions(
      screen.getByLabelText("Vista guardada"),
      "Prospectos",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar vista Prospectos" }),
    );

    await vi.waitFor(() =>
      expect(
        screen.queryByRole("option", { name: "Prospectos" }),
      ).not.toBeInTheDocument(),
    );
    expect(requested.map((entry) => entry.call)).toContain(
      "DELETE saved-views/1",
    );
    expect(applied.at(-1)).toBeNull();
  });

  it("does not offer to delete a view shared by someone else", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    stubApi();
    renderMenu();
    await screen.findByRole("option", { name: "Clientes del equipo" });

    await userEvent.selectOptions(
      screen.getByLabelText("Vista guardada"),
      "Clientes del equipo",
    );

    expect(
      screen.queryByRole("button", { name: /Eliminar vista/ }),
    ).not.toBeInTheDocument();
  });

  it("explains why a view could not be saved", async () => {
    signIn(["saved_views.view", "saved_views.manage"]);
    stubApi({ duplicateName: true });
    renderMenu();
    await screen.findByRole("option", { name: "Prospectos" });

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar vista" }),
    );
    await userEvent.type(
      screen.getByLabelText("Nombre de la vista"),
      "Prospectos",
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You already have a view with this name.",
    );
  });

  it("only lets users with manage permission save views", async () => {
    signIn(["saved_views.view"]);
    stubApi();
    renderMenu();

    await screen.findByRole("option", { name: "Prospectos" });

    expect(
      screen.queryByRole("button", { name: "Guardar vista" }),
    ).not.toBeInTheDocument();
  });

  it("is not shown to users who cannot see saved views", async () => {
    signIn(["contacts.view"]);
    const requested = stubApi();
    renderMenu();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryByLabelText("Vista guardada")).not.toBeInTheDocument();
    expect(requested).toEqual([]);
  });
});
