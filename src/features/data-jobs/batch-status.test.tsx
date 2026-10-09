import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExportBatch, ImportBatch } from "@/types/domain";
import { ExportBatchStatus, ImportBatchStatus } from "./batch-status";

const queuedImport: ImportBatch = {
  id: 5,
  entity_type: "contacts",
  original_filename: "contactos.csv",
  status: "queued",
  summary: null,
  error: null,
  created_at: "2026-10-09T12:00:00Z",
};

const queuedExport: ExportBatch = {
  id: 9,
  entity_type: "deals",
  status: "queued",
  row_count: null,
  error: null,
  created_at: "2026-10-09T12:00:00Z",
};

/** Answers each poll with the next payload; the last one repeats. */
function stubPolls(path: string, payloads: unknown[]) {
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      requested.push(url);
      const index = Math.min(requested.length, payloads.length) - 1;
      return new Response(
        JSON.stringify(
          url === "/api/backend/" + path
            ? { data: payloads[index], meta: {} }
            : { message: "Not found", errors: {} },
        ),
        {
          status: url === "/api/backend/" + path ? 200 : 404,
          headers: { "content-type": "application/json" },
        },
      );
    }),
  );
  return requested;
}

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ImportBatchStatus", () => {
  it("follows the import until it finishes and reports rows and row errors", async () => {
    stubPolls("imports/5", [
      { ...queuedImport, status: "processing" },
      {
        ...queuedImport,
        status: "completed",
        summary: {
          processed: 8,
          failed: 2,
          errors: [
            { row: 4, message: "The email has already been taken." },
            { row: 9, message: "The first name field is required." },
          ],
        },
      },
    ]);
    renderWithClient(<ImportBatchStatus batch={queuedImport} pollMs={10} />);

    expect(screen.getByText("Importación #5 en cola.")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Importación #5 completada: 8 filas importadas, 2 con errores.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fila 4: The email has already been taken."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fila 9: The first name field is required."),
    ).toBeInTheDocument();
  });

  it("stops asking once the import has finished", async () => {
    const requested = stubPolls("imports/5", [
      {
        ...queuedImport,
        status: "completed",
        summary: { processed: 3, failed: 0, errors: [] },
      },
    ]);
    renderWithClient(<ImportBatchStatus batch={queuedImport} pollMs={10} />);

    await screen.findByText(
      "Importación #5 completada: 3 filas importadas, 0 con errores.",
    );
    const requestsWhenDone = requested.length;
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(requested.length).toBe(requestsWhenDone);
  });

  it("shows why an import failed", async () => {
    stubPolls("imports/5", [
      {
        ...queuedImport,
        status: "failed",
        error: "The file could not be parsed.",
        summary: { processed: 0, failed: 0, errors: [] },
      },
    ]);
    renderWithClient(<ImportBatchStatus batch={queuedImport} pollMs={10} />);

    expect(
      await screen.findByText(
        "Importación #5 fallida: The file could not be parsed.",
      ),
    ).toBeInTheDocument();
  });
});

describe("ExportBatchStatus", () => {
  it("offers the download once the export is ready", async () => {
    stubPolls("exports/9", [
      { ...queuedExport, status: "processing" },
      {
        ...queuedExport,
        status: "completed",
        row_count: 42,
        download_url: "https://files.example.test/exports/9.csv?signature=abc",
      },
    ]);
    renderWithClient(<ExportBatchStatus batch={queuedExport} pollMs={10} />);

    expect(
      await screen.findByText("Exportación #9 lista: 42 filas."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Descargar archivo" }),
    ).toHaveAttribute(
      "href",
      "https://files.example.test/exports/9.csv?signature=abc",
    );
  });

  it("says the file is not downloadable when storage gives no link", async () => {
    stubPolls("exports/9", [
      { ...queuedExport, status: "completed", row_count: 42 },
    ]);
    renderWithClient(<ExportBatchStatus batch={queuedExport} pollMs={10} />);

    expect(
      await screen.findByText("Exportación #9 lista: 42 filas."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Descargar archivo" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "El almacenamiento configurado no ofrece enlace de descarga.",
      ),
    ).toBeInTheDocument();
  });
});
