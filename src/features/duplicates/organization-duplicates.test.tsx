import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import type { Organization } from "@/types/domain";
import { OrganizationDuplicates } from "./organization-duplicates";

const organization: Organization = {
  id: 7,
  name: "Acme",
  legal_name: null,
  email: "hola@acme.test",
  phone: null,
  website: "https://acme.test",
  owner_id: null,
  owner: null,
};

const candidate = {
  id: 2,
  type: "company",
  display_name: "ACME S.A.",
  email: "hola@acme.test",
  phone: "+593990000001",
  website: null,
  score: 50,
  confidence: "medium",
  matched_fields: ["email"],
  updated_at: "2026-10-09T20:07:25.000000Z",
};

const duplicate = {
  id: 2,
  name: "ACME S.A.",
  legal_name: "Acme Sociedad Anonima",
  email: "hola@acme.test",
  phone: "+593990000001",
  website: null,
  owner_id: null,
  owner: null,
  custom_fields: [],
  contacts: [],
  tags: [],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubApi() {
  let candidates = [candidate];
  const requested: Array<{ call: string; body?: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace("/api/backend/", "");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requested.push({ call: (init?.method ?? "GET") + " " + path, body });
      if (path === "organizations/duplicate-check")
        return json({ data: candidates, meta: { count: candidates.length } });
      if (path === "organizations/2")
        return json({ data: duplicate, meta: [] });
      if (path === "organizations/7/merge") {
        candidates = [];
        return json({ data: { ...organization, ...body }, meta: [] });
      }
      return json({ message: "Not found", errors: {} }, 404);
    }),
  );
  return requested;
}

function renderDuplicates() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <OrganizationDuplicates organization={organization} />
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

describe("OrganizationDuplicates", () => {
  it("checks the organization's own data against the rest, excluding itself", async () => {
    signIn(["organizations.view", "duplicates.manage"]);
    const requested = stubApi();
    renderDuplicates();

    await screen.findByText("ACME S.A.");

    expect(requested[0]).toEqual({
      call: "POST organizations/duplicate-check",
      body: {
        name: "Acme",
        email: "hola@acme.test",
        phone: null,
        website: "https://acme.test",
        exclude_id: 7,
      },
    });
  });

  it("links each possible duplicate to its own page", async () => {
    signIn(["organizations.view", "duplicates.manage"]);
    stubApi();
    renderDuplicates();

    expect(
      await screen.findByRole("link", { name: "ACME S.A." }),
    ).toHaveAttribute("href", "/organizations/2");
    expect(screen.getByText("Coincide en: correo")).toBeInTheDocument();
  });

  it("merges the duplicate keeping the name the user picks", async () => {
    signIn(["organizations.view", "duplicates.manage"]);
    const requested = stubApi();
    renderDuplicates();

    await userEvent.click(
      await screen.findByRole("button", { name: "Fusionar ACME S.A." }),
    );
    const dialog = within(screen.getByRole("dialog"));
    await userEvent.click(
      await dialog.findByRole("radio", { name: "Duplicado: ACME S.A." }),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Fusionar" }));

    await vi.waitFor(() =>
      expect(requested).toContainEqual({
        call: "POST organizations/7/merge",
        body: { duplicate_id: 2, field_overrides: { name: "ACME S.A." } },
      }),
    );
    await vi.waitFor(() =>
      expect(screen.queryByText(/posible duplicado/)).not.toBeInTheDocument(),
    );
  });

  it("does not look for duplicates for users who cannot merge them", async () => {
    signIn(["organizations.view"]);
    const requested = stubApi();
    renderDuplicates();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requested).toEqual([]);
  });
});
