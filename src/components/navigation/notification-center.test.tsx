import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import type { RealtimeClient } from "@/lib/realtime";
import { NotificationCenter } from "./notification-center";

// Realtime is off unless a test hands over a client.
const realtime = vi.hoisted(() => ({
  client: null as RealtimeClient | null,
}));
vi.mock("@/lib/realtime", async (original) => ({
  ...(await original<typeof import("@/lib/realtime")>()),
  connectRealtime: async () => realtime.client,
}));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function seed() {
  return [
    {
      id: "n-lead",
      event: "lead.assigned",
      title: "Nuevo lead asignado",
      body: "Ana Pérez fue asignada a tu cartera.",
      priority: "normal",
      action_url: null,
      context: { lead_id: 3 },
      read_at: null as string | null,
      created_at: "2026-10-09T12:00:00.000000Z",
    },
    {
      id: "n-sequence",
      event: "sequence.notification",
      title: "Secuencia en pausa",
      body: "Revisa la secuencia de bienvenida.",
      priority: "high",
      action_url: null,
      context: { sequence_id: 4, enrollment_id: 21 },
      read_at: null as string | null,
      created_at: "2026-10-09T11:00:00.000000Z",
    },
    {
      id: "n-old",
      event: "task.completed",
      title: "Tarea completada",
      body: null,
      priority: "low",
      action_url: "/tasks/8",
      context: [],
      read_at: "2026-10-08T09:00:00.000000Z" as string | null,
      created_at: "2026-10-08T08:00:00.000000Z",
    },
  ];
}

/** A small in-memory notifications API. */
function stubApi(
  options: { failList?: boolean; notifications?: ReturnType<typeof seed> } = {},
) {
  const notifications = options.notifications ?? seed();
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const path = url.replace("/api/backend/", "");
      requested.push(method + " " + path);
      if (path === "notifications/unread-count")
        return json({
          data: { count: notifications.filter((n) => !n.read_at).length },
          meta: {},
        });
      if (path === "notifications/read-all" && method === "PATCH") {
        const unread = notifications.filter((n) => !n.read_at);
        unread.forEach((n) => (n.read_at = "2026-10-09T13:00:00.000000Z"));
        return json({ data: { updated: unread.length }, meta: {} });
      }
      const read = path.match(/^notifications\/([^/]+)\/read$/);
      if (read && method === "PATCH") {
        const target = notifications.find((n) => n.id === read[1]);
        if (!target) return json({ message: "Not found", errors: {} }, 404);
        target.read_at = "2026-10-09T13:00:00.000000Z";
        return json({ data: target, meta: {} });
      }
      if (path.startsWith("notifications?")) {
        if (options.failList)
          return json({ message: "Server Error", errors: {} }, 500);
        return json({
          data: notifications,
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: 10,
            to: notifications.length,
            total: notifications.length,
          },
        });
      }
      return json({ message: "Not found", errors: {} }, 404);
    }),
  );
  return requested;
}

function renderCenter() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <NotificationCenter />
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

beforeEach(() => signIn(["notifications.view"]));

afterEach(() => {
  vi.unstubAllGlobals();
  realtime.client = null;
});

describe("NotificationCenter", () => {
  it("announces how many notifications are unread on the server", async () => {
    stubApi();
    renderCenter();

    expect(
      await screen.findByRole("button", {
        name: "Notificaciones, 2 sin leer",
      }),
    ).toBeInTheDocument();
  });

  it("counts a notification as soon as the server pushes it", async () => {
    const notifications = seed();
    stubApi({ notifications });
    let push: ((payload: unknown) => void) | null = null;
    realtime.client = {
      private: () => ({
        notification: (listener) => {
          push = listener;
        },
      }),
      leave: () => {},
      disconnect: () => {},
    };
    renderCenter();
    await screen.findByRole("button", { name: "Notificaciones, 2 sin leer" });
    await vi.waitFor(() => expect(push).not.toBeNull());

    const arrived = { ...notifications[0], id: "n-new", title: "Otro lead" };
    notifications.unshift(arrived);
    (push as unknown as (payload: unknown) => void)({
      ...arrived,
      tenant_id: 1,
    });

    expect(
      await screen.findByRole("button", { name: "Notificaciones, 3 sin leer" }),
    ).toBeInTheDocument();
  });

  it("offers the way to the notification preferences", async () => {
    stubApi();
    renderCenter();

    await userEvent.click(
      await screen.findByRole("button", { name: /Notificaciones/ }),
    );

    expect(screen.getByRole("link", { name: "Preferencias" })).toHaveAttribute(
      "href",
      "/profile#notificaciones",
    );
  });

  it("lists the user's notifications with links to what they are about", async () => {
    stubApi();
    renderCenter();

    await userEvent.click(
      await screen.findByRole("button", { name: /Notificaciones/ }),
    );

    expect(
      await screen.findByRole("link", { name: /Nuevo lead asignado/ }),
    ).toHaveAttribute("href", "/leads/3");
    expect(
      screen.getByText("Ana Pérez fue asignada a tu cartera."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Tarea completada/ }),
    ).toHaveAttribute("href", "/tasks/8");
    expect(
      screen.getByRole("button", { name: /Secuencia en pausa/ }),
    ).toBeInTheDocument();
  });

  it("marks everything as read on the server", async () => {
    const requested = stubApi();
    renderCenter();
    await userEvent.click(
      await screen.findByRole("button", { name: "Notificaciones, 2 sin leer" }),
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Marcar todas" }),
    );

    expect(await screen.findByText("Todo al día")).toBeInTheDocument();
    expect(requested).toContain("PATCH notifications/read-all");
    expect(
      screen.getByRole("button", { name: "Notificaciones" }),
    ).toBeInTheDocument();
  });

  it("marks a single notification as read when it is opened", async () => {
    const requested = stubApi();
    renderCenter();
    await userEvent.click(
      await screen.findByRole("button", { name: "Notificaciones, 2 sin leer" }),
    );

    await userEvent.click(
      await screen.findByRole("button", { name: /Secuencia en pausa/ }),
    );

    expect(await screen.findByText("1 sin leer")).toBeInTheDocument();
    expect(requested).toContain("PATCH notifications/n-sequence/read");
  });

  it("says so when the notifications cannot be loaded", async () => {
    stubApi({ failList: true });
    renderCenter();

    await userEvent.click(
      await screen.findByRole("button", { name: /Notificaciones/ }),
    );

    expect(
      await screen.findByText("No se pudieron cargar las notificaciones."),
    ).toBeInTheDocument();
  });

  it("stays out of the way for users who cannot see notifications", async () => {
    const requested = stubApi();
    signIn(["contacts.view"]);
    renderCenter();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(
      screen.queryByRole("button", { name: /Notificaciones/ }),
    ).not.toBeInTheDocument();
    expect(requested).toEqual([]);
  });
});
