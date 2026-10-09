import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import LeadsPage from "./page";

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
  id: 4,
  entity_type: "leads",
  name: "Web por origen",
  visibility: "private",
  sort_field: "source",
  sort_direction: "desc",
  columns: ["name", "source", "actions"],
  is_default: false,
  user_id: 1,
  owner: { id: 1, name: "Admin" },
  filters: [{ field: "status", operator: "eq", value: "qualified" }],
};

function stubApi() {
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = decodeURIComponent(url.replace("/api/backend/", ""));
      requested.push(path);
      if (path.startsWith("leads?"))
        return json(
          page(
            [
              {
                id: 3,
                first_name: "Ana",
                last_name: "Pérez",
                email: "ana@acme.test",
                source: "web",
                score: 40,
                status: "qualified",
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
      <LeadsPage />
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
      permissions: ["leads.view", "saved_views.view", "saved_views.manage"],
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

describe("LeadsPage", () => {
  it("asks the server for the order chosen on a column header", async () => {
    const requested = stubApi();
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Lead" }));
    await vi.waitFor(() =>
      expect(requested).toContain(
        "leads?page=1&per_page=10&sort=first_name&direction=asc",
      ),
    );

    await userEvent.click(await screen.findByRole("button", { name: "Lead" }));
    await vi.waitFor(() =>
      expect(requested).toContain(
        "leads?page=1&per_page=10&sort=first_name&direction=desc",
      ),
    );
  });

  it("applies the filters, order and columns of the chosen view", async () => {
    const requested = stubApi();
    renderPage();
    expect(
      await screen.findByRole("columnheader", { name: "Score" }),
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      await screen.findByLabelText("Vista guardada"),
      await screen.findByRole("option", { name: "Web por origen" }),
    );

    await vi.waitFor(() =>
      expect(requested).toContain(
        "leads?page=1&per_page=10&filter[status][operator]=eq&filter[status][value]=qualified&sort=source&direction=desc",
      ),
    );
    await vi.waitFor(() =>
      expect(
        screen.queryByRole("columnheader", { name: "Score" }),
      ).not.toBeInTheDocument(),
    );
    expect(requested).toContain("saved-views?entity_type=leads&per_page=50");
  });
});
