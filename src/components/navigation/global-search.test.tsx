import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalSearch } from "./global-search";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const meta = {
  current_page: 1,
  from: 1,
  last_page: 1,
  per_page: 25,
  to: 1,
  total: 1,
};

function renderSearch() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <GlobalSearch />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GlobalSearch", () => {
  it("lists records returned by the search endpoint, including documents", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.startsWith("/api/backend/search")
          ? jsonResponse({
              data: [
                {
                  type: "document",
                  id: 21,
                  title: "contrato-ana.pdf",
                  subtitle: "application/pdf",
                  relevance: 60,
                  updated_at: "2026-09-28T10:00:00.000000Z",
                },
              ],
              meta,
            })
          : jsonResponse({ data: [], meta: { ...meta, total: 0 } }),
      ),
    );
    renderSearch();

    await userEvent.type(screen.getByLabelText("Buscar en el CRM"), "ana");

    const link = await screen.findByRole("option", {
      name: /contrato-ana\.pdf/,
    });
    expect(link).toHaveAttribute("href", "/files");
    expect(screen.getByText("Documentos")).toBeInTheDocument();
  });

  it("warns that results are incomplete when the search endpoint is forbidden", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.startsWith("/api/backend/search")
          ? jsonResponse(
              {
                message: "You do not have permission to use global search.",
                errors: {},
              },
              403,
            )
          : jsonResponse({
              data: [
                {
                  id: 8,
                  title: "Llamar a Ana",
                  status: "pending",
                  priority: "normal",
                },
              ],
              meta,
            }),
      ),
    );
    renderSearch();

    await userEvent.type(screen.getByLabelText("Buscar en el CRM"), "ana");

    expect(
      await screen.findByRole("option", { name: /Llamar a Ana/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Algunos módulos no se pudieron consultar."),
    ).toBeInTheDocument();
  });

  it("explains that the search failed when nothing could be queried", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ message: "Server Error", errors: {} }, 500),
      ),
    );
    renderSearch();

    await userEvent.type(screen.getByLabelText("Buscar en el CRM"), "ana");

    expect(
      await screen.findByText(
        "No se pudo consultar la búsqueda. Intenta nuevamente.",
      ),
    ).toBeInTheDocument();
  });
});
