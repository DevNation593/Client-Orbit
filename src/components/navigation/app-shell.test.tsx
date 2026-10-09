import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import { AppShell } from "./app-shell";

const location = vi.hoisted(() => ({ pathname: "/leads" }));
vi.mock("next/navigation", () => ({
  usePathname: () => location.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function renderShell() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AppShell>
        <p>Contenido de la página</p>
      </AppShell>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 404 })),
  );
  useAuthStore.setState({
    user: { id: 1, name: "Admin", email: "admin@example.com", permissions: [] },
    tenant: { id: 1, name: "Demo" },
    tenants: [],
    ready: true,
    loading: false,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("AppShell", () => {
  it("shows the page of an enabled module", () => {
    location.pathname = "/leads";

    renderShell();

    expect(screen.getByText("Contenido de la página")).toBeInTheDocument();
  });

  it("does not open a page of a module that is not enabled, even by URL", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLED_MODULES", "contacts");
    location.pathname = "/leads/3";

    renderShell();

    expect(
      screen.queryByText("Contenido de la página"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Módulo no disponible")).toBeInTheDocument();
  });
});
