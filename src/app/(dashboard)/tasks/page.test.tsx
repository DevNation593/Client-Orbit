import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import TasksPage from "./page";

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
  id: 5,
  entity_type: "tasks",
  name: "Urgentes por vencer",
  visibility: "tenant",
  sort_field: "due_at",
  sort_direction: "asc",
  columns: null,
  is_default: false,
  user_id: 9,
  owner: { id: 9, name: "Otra persona" },
  filters: [
    { field: "priority", operator: "eq", value: "urgent" },
    { field: "status", operator: "eq", value: "pending" },
  ],
};

function stubApi() {
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = decodeURIComponent(url.replace("/api/backend/", ""));
      requested.push(path);
      if (path.startsWith("tasks?"))
        return json(
          page(
            [
              {
                id: 8,
                title: "Llamar a Ana",
                description: null,
                priority: "urgent",
                status: "pending",
                due_at: "2026-10-12T15:00:00Z",
                related_id: 7,
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
      <TasksPage />
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
      permissions: ["tasks.view", "saved_views.view"],
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

describe("TasksPage", () => {
  it("filters by the status chosen in the toolbar", async () => {
    const requested = stubApi();
    renderPage();

    await userEvent.selectOptions(
      await screen.findByLabelText("Filtrar por estado"),
      "completed",
    );

    await vi.waitFor(() =>
      expect(requested).toContain(
        "tasks?page=1&per_page=10&filter[status][operator]=eq&filter[status][value]=completed",
      ),
    );
  });

  it("applies the filters and order of the chosen view", async () => {
    const requested = stubApi();
    renderPage();

    await userEvent.selectOptions(
      await screen.findByLabelText("Vista guardada"),
      await screen.findByRole("option", { name: "Urgentes por vencer" }),
    );

    await vi.waitFor(() =>
      expect(requested).toContain(
        "tasks?page=1&per_page=10&filter[priority][operator]=eq&filter[priority][value]=urgent&filter[status][operator]=eq&filter[status][value]=pending&sort=due_at&direction=asc",
      ),
    );
    expect(screen.getByLabelText("Filtrar por estado")).toHaveValue("pending");
    expect(requested).toContain("saved-views?entity_type=tasks&per_page=50");
  });
});
