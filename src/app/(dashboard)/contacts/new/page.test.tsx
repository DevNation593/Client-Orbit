import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import NewContactPage from "./page";

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const candidate = {
  id: 2,
  type: "contact",
  display_name: "Ana María Pérez",
  email: "ana@acme.test",
  phone: null,
  score: 60,
  confidence: "medium",
  matched_fields: ["email"],
  updated_at: "2026-10-09T20:07:25.000000Z",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubApi(options: { candidates?: unknown[]; checkFails?: boolean }) {
  const requested: Array<{ call: string; body?: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace("/api/backend/", "");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requested.push({ call: (init?.method ?? "GET") + " " + path, body });
      if (path.startsWith("field-definitions"))
        return json({ data: [], meta: [] });
      if (path === "contacts/duplicate-check") {
        if (options.checkFails)
          return json({ message: "Server Error", errors: {} }, 500);
        const candidates = options.candidates ?? [];
        return json({ data: candidates, meta: { count: candidates.length } });
      }
      if (path === "contacts" && init?.method === "POST")
        return json({ data: { id: 31, ...body }, meta: [] }, 201);
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
      <NewContactPage />
    </QueryClientProvider>,
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText("Nombre"), "Ana");
  await userEvent.type(screen.getByLabelText("Correo"), "ana@acme.test");
  await userEvent.click(screen.getByRole("button", { name: "Crear contacto" }));
}

beforeEach(() => {
  router.replace.mockClear();
  useAuthStore.setState({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      permissions: ["contacts.view", "contacts.create"],
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

describe("NewContactPage", () => {
  it("creates the contact straight away when nobody looks like it", async () => {
    const requested = stubApi({});
    renderPage();

    await fillAndSubmit();

    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/contacts/31"),
    );
    expect(
      requested.find((entry) => entry.call === "POST contacts/duplicate-check")
        ?.body,
    ).toEqual({ first_name: "Ana", email: "ana@acme.test" });
  });

  it("shows the contacts that look like the new one before creating it", async () => {
    const requested = stubApi({ candidates: [candidate] });
    renderPage();

    await fillAndSubmit();

    const dialog = within(await screen.findByRole("dialog"));
    expect(
      dialog.getByRole("link", { name: "Ana María Pérez" }),
    ).toHaveAttribute("href", "/contacts/2");
    expect(dialog.getByText("Coincide en: correo")).toBeInTheDocument();
    expect(requested.map((entry) => entry.call)).not.toContain("POST contacts");
  });

  it("creates the contact anyway when the user says it is not a duplicate", async () => {
    const requested = stubApi({ candidates: [candidate] });
    renderPage();
    await fillAndSubmit();

    await userEvent.click(
      await screen.findByRole("button", { name: "Crear de todos modos" }),
    );

    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/contacts/31"),
    );
    expect(
      requested.find((entry) => entry.call === "POST contacts")?.body,
    ).toMatchObject({ first_name: "Ana", email: "ana@acme.test" });
  });

  it("does not create anything when the user goes back to the form", async () => {
    const requested = stubApi({ candidates: [candidate] });
    renderPage();
    await fillAndSubmit();

    await userEvent.click(
      await screen.findByRole("button", { name: "Revisar datos" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(requested.map((entry) => entry.call)).not.toContain("POST contacts");
  });

  it("does not block the creation when the check itself fails", async () => {
    stubApi({ checkFails: true });
    renderPage();

    await fillAndSubmit();

    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/contacts/31"),
    );
  });
});
