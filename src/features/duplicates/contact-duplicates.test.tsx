import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import type { Contact } from "@/types/domain";
import { ContactDuplicates } from "./contact-duplicates";

const contact: Contact = {
  id: 7,
  first_name: "Ana",
  last_name: "Pérez",
  email: "ana@example.test",
  phone: "+593990000000",
};

const candidate = {
  id: 2,
  type: "contact",
  display_name: "Ana María Pérez",
  email: "ANA@example.test",
  phone: null,
  score: 60,
  confidence: "medium",
  matched_fields: ["email"],
  updated_at: "2026-10-09T19:37:08Z",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Duplicate check returns `candidates`; a successful merge empties them. */
function stubApi(options: { candidates?: unknown[]; mergeFails?: boolean }) {
  let candidates = options.candidates ?? [candidate];
  const requested: Array<{ call: string; body?: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace("/api/backend/", "");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requested.push({ call: (init?.method ?? "GET") + " " + path, body });
      if (path === "contacts/duplicate-check")
        return json({ data: candidates, meta: { count: candidates.length } });
      if (path === "contacts/2")
        return json({
          data: {
            id: 2,
            first_name: "Ana María",
            last_name: "Pérez",
            email: "ANA@example.test",
            phone: "+593991111111",
            status: null,
            owner_id: null,
            owner: null,
          },
          meta: [],
        });
      if (path === "contacts/7/merge") {
        if (options.mergeFails)
          return json(
            {
              message: "You do not have permission to merge duplicate records.",
              errors: {},
            },
            403,
          );
        candidates = [];
        return json({ data: { ...contact, tags: [] }, meta: {} });
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
      <ContactDuplicates contact={contact} />
    </QueryClientProvider>,
  );
}

/** The dialog's button, once the duplicate has been loaded for comparison. */
async function mergeButton() {
  const button = within(screen.getByRole("dialog")).getByRole("button", {
    name: "Fusionar",
  });
  await vi.waitFor(() => expect(button).toBeEnabled());
  return button;
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

describe("ContactDuplicates", () => {
  it("checks the contact's own data against the rest, excluding itself", async () => {
    signIn(["contacts.view", "duplicates.manage"]);
    const requested = stubApi({});
    renderDuplicates();

    await screen.findByText("Ana María Pérez");

    expect(requested[0]).toEqual({
      call: "POST contacts/duplicate-check",
      body: {
        first_name: "Ana",
        last_name: "Pérez",
        email: "ana@example.test",
        phone: "+593990000000",
        exclude_id: 7,
      },
    });
  });

  it("lists each possible duplicate with why it matched and a link to it", async () => {
    signIn(["contacts.view", "duplicates.manage"]);
    stubApi({});
    renderDuplicates();

    const item = (await screen.findByText("Ana María Pérez")).closest(
      "li",
    ) as HTMLElement;

    expect(screen.getByText("1 posible duplicado")).toBeInTheDocument();
    expect(within(item).getByText("Coincide en: correo")).toBeInTheDocument();
    expect(
      within(item).getByText("Confianza media · 60/100"),
    ).toBeInTheDocument();
    expect(
      within(item).getByRole("link", { name: "Ana María Pérez" }),
    ).toHaveAttribute("href", "/contacts/2");
  });

  it("merges the duplicate into this contact after confirmation", async () => {
    signIn(["contacts.view", "duplicates.manage"]);
    const requested = stubApi({});
    renderDuplicates();

    await userEvent.click(
      await screen.findByRole("button", { name: "Fusionar Ana María Pérez" }),
    );
    expect(requested.map((entry) => entry.call)).not.toContain(
      "POST contacts/7/merge",
    );
    await userEvent.click(await mergeButton());

    await vi.waitFor(() =>
      expect(screen.queryByText("Ana María Pérez")).not.toBeInTheDocument(),
    );
    expect(requested).toContainEqual({
      call: "POST contacts/7/merge",
      body: { duplicate_id: 2 },
    });
  });

  it("asks which value to keep where the two contacts differ", async () => {
    signIn(["contacts.view", "duplicates.manage"]);
    const requested = stubApi({});
    renderDuplicates();

    await userEvent.click(
      await screen.findByRole("button", { name: "Fusionar Ana María Pérez" }),
    );
    const dialog = within(screen.getByRole("dialog"));
    const phone = within(
      await dialog.findByRole("group", { name: "Teléfono" }),
    );
    expect(
      phone.getByRole("radio", { name: "Este contacto: +593990000000" }),
    ).toBeChecked();
    expect(
      dialog.queryByRole("group", { name: "Correo" }),
    ).not.toBeInTheDocument();
    expect(
      dialog.queryByRole("group", { name: "Apellido" }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      phone.getByRole("radio", { name: "Duplicado: +593991111111" }),
    );
    await userEvent.click(await mergeButton());

    await vi.waitFor(() =>
      expect(requested).toContainEqual({
        call: "POST contacts/7/merge",
        body: {
          duplicate_id: 2,
          field_overrides: { phone: "+593991111111" },
        },
      }),
    );
  });

  it("keeps the duplicate listed and explains when the merge is rejected", async () => {
    signIn(["contacts.view", "duplicates.manage"]);
    stubApi({ mergeFails: true });
    renderDuplicates();

    await userEvent.click(
      await screen.findByRole("button", { name: "Fusionar Ana María Pérez" }),
    );
    await userEvent.click(await mergeButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to merge duplicate records.",
    );
    expect(screen.getByText("Ana María Pérez")).toBeInTheDocument();
  });

  it("shows nothing when the contact has no duplicates", async () => {
    signIn(["contacts.view", "duplicates.manage"]);
    const requested = stubApi({ candidates: [] });
    renderDuplicates();

    await vi.waitFor(() => expect(requested.length).toBe(1));

    expect(screen.queryByText(/posible/)).not.toBeInTheDocument();
  });

  it("does not look for duplicates for users who cannot merge them", async () => {
    signIn(["contacts.view"]);
    const requested = stubApi({});
    renderDuplicates();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requested).toEqual([]);
    expect(screen.queryByText(/posible/)).not.toBeInTheDocument();
  });
});
