import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ContactDetailPage from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const contact = {
  id: 7,
  first_name: "Ana",
  last_name: "Pérez",
  email: "ana@example.com",
  phone: "+593 99 000 0000",
  status: "active",
  owner_id: 5,
  owner: { id: 5, name: "Luis Mora", email: "luis@example.com" },
  custom_fields: {},
  organizations: [{ id: 9, name: "Anaconda SA" }],
  created_at: "2026-09-01T10:00:00.000000Z",
  updated_at: "2026-10-01T10:00:00.000000Z",
};

const overview = {
  contact,
  modules: {
    companies: { count: 1, items: [{ id: 9, name: "Anaconda SA" }] },
    opportunities: {
      count: 1,
      items: [
        {
          id: 12,
          pipeline_id: 1,
          stage_id: 3,
          pipeline: { id: 1, name: "Ventas" },
          stage: { id: 3, pipeline_id: 1, name: "Propuesta", color: null },
          owner: { id: 5, name: "Luis Mora" },
          contact_id: 7,
          organization_id: 9,
          name: "Renovación Anaconda",
          value: "1500.00",
          currency: "USD",
          status: "open",
        },
      ],
    },
    tasks: { count: 0, items: [] },
    documents: { count: 0, items: [] },
    relationships: { count: 0, items: [] },
  },
  unavailable_modules: ["meetings", "sms", "calls", "tickets"],
  generated_at: "2026-10-09T12:00:00.000000Z",
};

function timelinePage(page: number) {
  const event =
    page === 1
      ? {
          id: "activity:42",
          source: "activity",
          event: "call",
          subject: "Llamada de seguimiento",
          body: "Acordamos una demo.",
          entity: { type: "contact", id: 7 },
          actor: { id: 5, name: "Luis Mora" },
          metadata: {},
          occurred_at: "2026-10-02T15:30:00.000000Z",
        }
      : {
          id: "activity:11",
          source: "activity",
          event: "contact.created",
          subject: "contact · created",
          body: null,
          entity: { type: "contact", id: 7 },
          actor: null,
          metadata: {},
          occurred_at: "2026-09-01T10:00:00.000000Z",
        };
  return {
    data: [event],
    meta: {
      current_page: page,
      from: page,
      last_page: 2,
      per_page: 25,
      to: page,
      total: 2,
    },
  };
}

function stubApi() {
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      requested.push(url);
      const path = url.replace("/api/backend/", "");
      let body: unknown = { message: "Not found", errors: {} };
      let status = 404;
      if (path === "contacts/7")
        [body, status] = [{ data: contact, meta: {} }, 200];
      else if (path.startsWith("field-definitions"))
        [body, status] = [{ data: [], meta: {} }, 200];
      else if (path.startsWith("contacts/7/overview"))
        [body, status] = [{ data: overview, meta: {} }, 200];
      else if (path.startsWith("contacts/7/timeline"))
        [body, status] = [timelinePage(path.includes("?page=2&") ? 2 : 1), 200];
      return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
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
      <ContactDetailPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ContactDetailPage", () => {
  it("shows the contact's own records and activity from the overview and timeline endpoints", async () => {
    const requested = stubApi();
    renderPage();

    expect(
      await screen.findByRole("link", { name: /Renovación Anaconda/ }),
    ).toHaveAttribute("href", "/deals/12");
    expect(
      await screen.findByText("Llamada de seguimiento"),
    ).toBeInTheDocument();

    const paths = requested.map((url) => url.replace("/api/backend/", ""));
    expect(paths).toContain("contacts/7/overview?recent_limit=10");
    expect(paths).toContain("contacts/7/timeline?page=1&per_page=25");
    // The page no longer downloads tenant-wide lists to filter them locally.
    for (const list of ["deals", "tasks", "files", "relations", "activities"])
      expect(paths.filter((path) => path.startsWith(list + "?"))).toEqual([]);
  });

  it("loads older activity on demand", async () => {
    const requested = stubApi();
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: "Cargar actividad anterior" }),
    );

    expect(await screen.findByText("Contacto creado")).toBeInTheDocument();
    expect(screen.getByText("Llamada de seguimiento")).toBeInTheDocument();
    expect(requested).toContain(
      "/api/backend/contacts/7/timeline?page=2&per_page=25",
    );
    expect(
      screen.queryByRole("button", { name: "Cargar actividad anterior" }),
    ).not.toBeInTheDocument();
  });
});
