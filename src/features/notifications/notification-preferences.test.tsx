import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import { NotificationPreferences } from "./notification-preferences";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const meta = {
  events: ["lead.assigned", "task.overdue", "sequence.paused"],
  channels: [
    { key: "in_app", operational: true },
    { key: "email", operational: true },
    { key: "push", operational: false },
  ],
  defaults: { in_app: true, email: false, push: false },
};

/** In-memory `/notification-preferences`, seeded with one muted event. */
function stubApi(options: { saveFails?: boolean } = {}) {
  const preferences = [
    {
      id: 1,
      event: "task.overdue",
      channel: "in_app",
      enabled: false,
      delivery: "immediate",
    },
  ];
  const requested: Array<{ call: string; body?: unknown }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const path = url.replace("/api/backend/", "");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requested.push({ call: method + " " + path, body });
      if (path !== "notification-preferences")
        return json({ message: "Not found", errors: {} }, 404);
      if (method === "PUT") {
        if (options.saveFails)
          return json(
            {
              message: "You cannot change notification preferences.",
              errors: {},
            },
            403,
          );
        for (const change of body.preferences) {
          const existing = preferences.find(
            (row) =>
              row.event === change.event && row.channel === change.channel,
          );
          if (existing) existing.enabled = change.enabled;
          else
            preferences.push({
              id: preferences.length + 1,
              delivery: "immediate",
              ...change,
            });
        }
      }
      return json({ data: preferences, meta });
    }),
  );
  return requested;
}

function renderPreferences() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <NotificationPreferences />
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

function toggle(event: string, channel: string) {
  return screen.getByRole("checkbox", { name: event + ": " + channel });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NotificationPreferences", () => {
  it("shows what the user receives for each event, defaults included", async () => {
    signIn(["notifications.view", "notifications.manage"]);
    stubApi();
    renderPreferences();

    await screen.findByText("Lead asignado");

    expect(toggle("Lead asignado", "en la aplicación")).toBeChecked();
    expect(toggle("Lead asignado", "correo")).not.toBeChecked();
    expect(toggle("Tarea vencida", "en la aplicación")).not.toBeChecked();
  });

  it("offers only the channels that can deliver today", async () => {
    signIn(["notifications.view", "notifications.manage"]);
    stubApi();
    renderPreferences();

    const header = within(
      (await screen.findAllByRole("row"))[0] as HTMLElement,
    );

    expect(
      header.getAllByRole("columnheader").map((cell) => cell.textContent),
    ).toEqual(["Evento", "En la aplicación", "Correo"]);
  });

  it("names events it has no translation for by their key", async () => {
    signIn(["notifications.view", "notifications.manage"]);
    stubApi();
    renderPreferences();

    expect(await screen.findByText("sequence.paused")).toBeInTheDocument();
  });

  it("saves a change as soon as it is made", async () => {
    signIn(["notifications.view", "notifications.manage"]);
    const requested = stubApi();
    renderPreferences();
    await screen.findByText("Lead asignado");

    await userEvent.click(toggle("Lead asignado", "correo"));

    await vi.waitFor(() =>
      expect(toggle("Lead asignado", "correo")).toBeChecked(),
    );
    expect(requested).toContainEqual({
      call: "PUT notification-preferences",
      body: {
        preferences: [
          { event: "lead.assigned", channel: "email", enabled: true },
        ],
      },
    });
  });

  it("leaves the choice as it was and explains when it cannot be saved", async () => {
    signIn(["notifications.view", "notifications.manage"]);
    stubApi({ saveFails: true });
    renderPreferences();
    await screen.findByText("Lead asignado");

    await userEvent.click(toggle("Lead asignado", "correo"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You cannot change notification preferences.",
    );
    expect(toggle("Lead asignado", "correo")).not.toBeChecked();
  });

  it("is read-only for users who cannot change their preferences", async () => {
    signIn(["notifications.view"]);
    stubApi();
    renderPreferences();
    await screen.findByText("Lead asignado");

    expect(toggle("Lead asignado", "correo")).toBeDisabled();
  });

  it("is not shown to users who cannot see notifications", async () => {
    signIn(["contacts.view"]);
    const requested = stubApi();
    renderPreferences();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.queryByText("Lead asignado")).not.toBeInTheDocument();
    expect(requested).toEqual([]);
  });
});
