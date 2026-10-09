import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

beforeEach(() => {
  useAuthStore.setState({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      permissions: ["contacts.view", "leads.view", "tasks.view"],
    },
    tenant: { id: 1, name: "Demo" },
    tenants: [],
    ready: true,
    loading: false,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function links() {
  return screen.getAllByRole("link").map((link) => link.textContent);
}

describe("Sidebar", () => {
  it("lists the modules the user may see", () => {
    render(<Sidebar onClose={() => {}} open />);

    expect(links()).toEqual(
      expect.arrayContaining(["Resumen", "Contactos", "Leads", "Tareas"]),
    );
    expect(links()).not.toContain("Oportunidades");
  });

  it("leaves out the modules that are not enabled in this deployment", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLED_MODULES", "contacts,tasks");

    render(<Sidebar onClose={() => {}} open />);

    expect(links()).toEqual(
      expect.arrayContaining(["Resumen", "Contactos", "Tareas"]),
    );
    expect(links()).not.toContain("Leads");
  });

  it("drops a section that is left without modules", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLED_MODULES", "contacts");
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        permissions: ["contacts.view", "files.view"],
      },
    });

    render(<Sidebar onClose={() => {}} open />);

    expect(screen.queryByText("Operación")).not.toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
  });
});
