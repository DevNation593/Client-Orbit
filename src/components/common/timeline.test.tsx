import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { TimelineEntry } from "@/features/customer360/timeline";
import { ActivityTimeline } from "./timeline";

const entries: TimelineEntry[] = [
  {
    id: "activity:42",
    type: "call",
    subject: "Llamada de seguimiento",
    body: "Acordamos una demo.",
    user: { id: 5, name: "Luis Mora" },
    occurred_at: "2026-10-02T15:30:00.000000Z",
  },
  {
    id: "audit:9",
    type: "system",
    subject: "Registro actualizado",
    body: "Campos modificados: email",
    user: null,
    occurred_at: "2026-10-01T10:00:00.000000Z",
  },
];

describe("ActivityTimeline", () => {
  it("renders entries from any source with their author", () => {
    render(<ActivityTimeline activities={entries} showFilters={false} />);

    expect(screen.getByText("Llamada de seguimiento")).toBeInTheDocument();
    expect(screen.getByText("Luis Mora")).toBeInTheDocument();
    expect(screen.getByText("Registro actualizado")).toBeInTheDocument();
    expect(screen.getByText("Sistema")).toBeInTheDocument();
  });

  it("offers to load older activity while there are more pages", async () => {
    let requests = 0;
    render(
      <ActivityTimeline
        activities={entries}
        hasMore
        onLoadMore={() => {
          requests += 1;
        }}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Cargar actividad anterior" }),
    );

    expect(requests).toBe(1);
  });

  it("does not offer more activity on the last page", () => {
    render(<ActivityTimeline activities={entries} />);

    expect(
      screen.queryByRole("button", { name: "Cargar actividad anterior" }),
    ).not.toBeInTheDocument();
  });

  it("disables the button while the next page is loading", () => {
    render(
      <ActivityTimeline
        activities={entries}
        hasMore
        loadingMore
        onLoadMore={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Cargando…" })).toBeDisabled();
  });
});
