import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CustomerOverview } from "@/features/customer360/overview";
import type { Contact } from "@/types/domain";
import { Customer360Panels } from "./customer360";

const contact: Contact = {
  id: 7,
  first_name: "Ana",
  last_name: "Pérez",
  email: "ana@example.com",
};

const modules: CustomerOverview["modules"] = {
  companies: { count: 1, items: [{ id: 9, name: "Anaconda SA" }] },
  opportunities: {
    count: 1,
    items: [
      {
        id: 12,
        pipeline_id: 1,
        stage_id: 3,
        stage: { id: 3, pipeline_id: 1, name: "Propuesta", position: 2 },
        name: "Renovación Anaconda",
        value: 1500,
        currency: "USD",
      },
    ],
  },
  tasks: {
    count: 12,
    items: [
      {
        id: 8,
        title: "Llamar a Ana",
        status: "pending",
        priority: "high",
        due_at: "2026-10-12T15:00:00.000000Z",
      },
    ],
  },
  documents: {
    count: 1,
    items: [
      {
        id: 21,
        filename: "contrato-ana.pdf",
        mime_type: "application/pdf",
        size: 2048,
        created_at: "2026-09-28T10:00:00.000000Z",
      },
    ],
  },
  relationships: {
    count: 1,
    items: [
      {
        id: 4,
        relation_type: "decision_maker",
        from_type: "contact",
        from_id: "7",
        to_type: "organization",
        to_id: "9",
      },
    ],
  },
};

function card(title: string) {
  return screen.getByRole("region", { name: title });
}

describe("Customer360Panels", () => {
  it("lists the records of every module the overview returned", () => {
    render(<Customer360Panels contact={contact} modules={modules} />);

    expect(
      screen.getByRole("link", { name: /Renovación Anaconda/ }),
    ).toHaveAttribute("href", "/deals/12");
    expect(screen.getByRole("link", { name: /Llamar a Ana/ })).toHaveAttribute(
      "href",
      "/tasks/8",
    );
    expect(
      screen.getByRole("link", { name: /contrato-ana\.pdf/ }),
    ).toHaveAttribute("href", "/api/backend/files/21/download");
    expect(
      screen.getByRole("link", { name: "Abrir Anaconda SA" }),
    ).toHaveAttribute("href", "/organizations/9");
  });

  it("says how many records exist when the overview lists only the most recent", () => {
    render(<Customer360Panels contact={contact} modules={modules} />);

    expect(
      within(card("Tareas")).getByText("Mostrando 1 de 12"),
    ).toBeInTheDocument();
    expect(
      within(card("Oportunidades")).queryByText(/Mostrando/),
    ).not.toBeInTheDocument();
  });

  it("leaves out modules the user is not allowed to see", () => {
    render(
      <Customer360Panels
        contact={contact}
        modules={{ tasks: modules.tasks }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Tareas" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Oportunidades" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Archivos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Relaciones" }),
    ).not.toBeInTheDocument();
  });

  it("shows every module as loading until the overview arrives", () => {
    render(<Customer360Panels contact={contact} loading modules={undefined} />);

    for (const title of ["Oportunidades", "Tareas", "Relaciones", "Archivos"])
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(
      screen.queryByText("No hay registros asociados todavía."),
    ).not.toBeInTheDocument();
  });
});
