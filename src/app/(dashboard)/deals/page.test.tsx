import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import DealsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const pipeline = {
  id: 1,
  name: "Ventas",
  is_default: true,
  active: true,
  stages: [
    { id: 1, pipeline_id: 1, name: "Nuevo", position: 1, probability: 10 },
    { id: 2, pipeline_id: 1, name: "Propuesta", position: 2, probability: 50 },
  ],
};

function deal(stageId: number) {
  return {
    id: 12,
    pipeline_id: 1,
    stage_id: stageId,
    stage: pipeline.stages.find((stage) => stage.id === stageId),
    owner_id: null,
    owner: null,
    contact_id: 7,
    organization_id: null,
    name: "Renovación Anaconda",
    value: "1500.00",
    currency: "USD",
    status: "open",
    expected_close_date: null,
    custom_fields: [],
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Serves the deal list from `stageId` and lets each test decide the PATCH outcome. */
function stubApi(patch: () => Promise<Response>) {
  const state = { stageId: 1 };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace("/api/backend/", "");
      if (path === "pipelines") return json({ data: [pipeline], meta: {} });
      if (path === "deals/12" && init?.method === "PATCH") {
        const response = await patch();
        if (response.ok) state.stageId = 2;
        return response;
      }
      if (path.startsWith("deals?"))
        return json({
          data: [deal(state.stageId)],
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            per_page: 100,
            to: 1,
            total: 1,
          },
        });
      return json({ message: "Not found", errors: {} }, 404);
    }),
  );
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <DealsPage />
    </QueryClientProvider>,
  );
}

async function dragDealTo(stageName: string) {
  const card = (
    await screen.findByRole("link", {
      name: "Renovación Anaconda",
    })
  ).closest("article") as HTMLElement;
  fireEvent.dragStart(card);
  fireEvent.drop(screen.getByRole("region", { name: stageName }));
}

function column(stageName: string) {
  return within(screen.getByRole("region", { name: stageName }));
}

beforeEach(() => {
  window.localStorage.clear();
  useAuthStore.setState({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      permissions: ["deals.view", "deals.create", "deals.update"],
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

describe("DealsPage board", () => {
  it("moves the card to the new stage without waiting for the server", async () => {
    let respond: (response: Response) => void = () => {};
    stubApi(
      () =>
        new Promise<Response>((resolve) => {
          respond = resolve;
        }),
    );
    renderPage();

    await dragDealTo("Propuesta");

    expect(
      await column("Propuesta").findByRole("link", {
        name: "Renovación Anaconda",
      }),
    ).toBeInTheDocument();
    expect(
      column("Nuevo").queryByRole("link", { name: "Renovación Anaconda" }),
    ).not.toBeInTheDocument();

    respond(json({ data: deal(2), meta: {} }));
    expect(
      await column("Propuesta").findByRole("link", {
        name: "Renovación Anaconda",
      }),
    ).toBeInTheDocument();
  });

  it("puts the card back and explains why when the server rejects the move", async () => {
    stubApi(async () =>
      json(
        {
          message: "The selected stage does not belong to the pipeline.",
          errors: {
            stage_id: ["The selected stage does not belong to the pipeline."],
          },
        },
        422,
      ),
    );
    renderPage();

    await dragDealTo("Propuesta");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo mover «Renovación Anaconda»: The selected stage does not belong to the pipeline.",
    );
    expect(
      column("Nuevo").getByRole("link", { name: "Renovación Anaconda" }),
    ).toBeInTheDocument();
    expect(
      column("Propuesta").queryByRole("link", { name: "Renovación Anaconda" }),
    ).not.toBeInTheDocument();
  });
});
