import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Can } from "./can";
import { useAuthStore } from "@/lib/auth-store";

describe("Can", () => {
  it("renders the fallback without an authenticated user", () => {
    useAuthStore.setState({
      user: null,
      tenant: null,
      tenants: [],
      ready: true,
      loading: false,
    });
    render(
      <Can fallback={<span>Sin acceso</span>} permission="contacts.create">
        <span>Crear</span>
      </Can>,
    );
    expect(screen.getByText("Sin acceso")).toBeInTheDocument();
  });

  it("hides an action that is not in the active permission set", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        permissions: ["contacts.view"],
      },
      tenant: { id: 1, name: "Demo" },
      tenants: [],
      ready: true,
      loading: false,
    });
    render(
      <Can fallback={<span>Sin acceso</span>} permission="contacts.create">
        <span>Crear</span>
      </Can>,
    );
    expect(screen.getByText("Sin acceso")).toBeInTheDocument();
  });
});
