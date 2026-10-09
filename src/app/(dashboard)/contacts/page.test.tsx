import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import ContactsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function page(data: unknown[], perPage: number) {
  return {
    data,
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: perPage,
      to: data.length,
      total: data.length,
    },
  };
}

const savedView = {
  id: 1,
  entity_type: "contacts",
  name: "Seguimiento semanal",
  visibility: "private",
  sort_field: null,
  sort_direction: null,
  columns: ["name", "status", "actions"],
  is_default: false,
  user_id: 1,
  owner: { id: 1, name: "Admin" },
  filters: [
    { field: "status", operator: "eq", value: "prospect" },
    { field: "email", operator: "contains", value: "@acme" },
  ],
};

function stubApi() {
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = decodeURIComponent(url.replace("/api/backend/", ""));
      requested.push(path);
      if (path.startsWith("contacts?"))
        return json(
          page(
            [
              {
                id: 7,
                first_name: "Ana",
                last_name: "Pérez",
                email: "ana@acme.test",
                phone: "+593990000000",
                status: "prospect",
                organizations: [],
                created_at: "2026-09-01T10:00:00Z",
              },
            ],
            10,
          ),
        );
      if (path.startsWith("saved-views?")) return json(page([savedView], 50));
      return json({ message: "Not found", errors: {} }, 404);
    }),
  );
  return requested;
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ContactsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  useAuthStore.setState({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      permissions: ["contacts.view", "saved_views.view", "saved_views.manage"],
    },
    tenant: { id: 1, name: "Demo" },
    tenants: [],
    ready: true,
    loading: false,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ContactsPage saved views", () => {
  it("applies the filters and columns of the chosen view to the list", async () => {
    const requested = stubApi();
    renderPage();
    expect(
      await screen.findByRole("columnheader", { name: "Teléfono" }),
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      await screen.findByLabelText("Vista guardada"),
      await screen.findByRole("option", { name: "Seguimiento semanal" }),
    );

    await vi.waitFor(() =>
      expect(requested).toContain(
        "contacts?page=1&per_page=10&filter[status][operator]=eq&filter[status][value]=prospect&filter[email][operator]=contains&filter[email][value]=@acme",
      ),
    );
    await vi.waitFor(() =>
      expect(
        screen.queryByRole("columnheader", { name: "Teléfono" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("columnheader", { name: "Estado" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por estado")).toHaveValue("prospect");
    expect(
      screen.getByRole("button", { name: "2 filtros" }),
    ).toBeInTheDocument();
  });

  it("keeps the other filters of a view when the status is changed by hand", async () => {
    const requested = stubApi();
    renderPage();
    await userEvent.selectOptions(
      await screen.findByLabelText("Vista guardada"),
      await screen.findByRole("option", { name: "Seguimiento semanal" }),
    );

    await userEvent.selectOptions(
      screen.getByLabelText("Filtrar por estado"),
      "active",
    );

    await vi.waitFor(() =>
      expect(requested).toContain(
        "contacts?page=1&per_page=10&filter[email][operator]=contains&filter[email][value]=@acme&filter[status][operator]=eq&filter[status][value]=active",
      ),
    );
  });
});
