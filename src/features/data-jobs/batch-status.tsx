"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { crmApi } from "@/lib/api/resources";
import type { BatchStatus, ExportBatch, ImportBatch } from "@/types/domain";

const DEFAULT_POLL_MS = 2000;

function isFinished(status: BatchStatus) {
  return status === "completed" || status === "failed";
}

/** Re-reads a queued batch until its job ends. */
function useBatch<T extends { id: number; status: BatchStatus }>(
  kind: "imports" | "exports",
  batch: T,
  fetchBatch: (id: number) => Promise<T>,
  pollMs: number,
): T {
  const query = useQuery<T>({
    queryKey: [kind, batch.id],
    queryFn: () => fetchBatch(batch.id),
    initialData: batch,
    staleTime: 0,
    refetchInterval: ({ state }) =>
      state.data && isFinished(state.data.status) ? false : pollMs,
  });
  return query.data ?? batch;
}

export function ImportBatchStatus({
  batch,
  pollMs = DEFAULT_POLL_MS,
}: {
  batch: ImportBatch;
  pollMs?: number;
}) {
  const current = useBatch("imports", batch, crmApi.imports.get, pollMs);
  const label = "Importación #" + current.id;

  if (current.status === "failed")
    return (
      <StatusBox tone="danger">
        {label} fallida: {current.error ?? "error desconocido"}
      </StatusBox>
    );
  if (current.status === "completed") {
    const summary = current.summary ?? { processed: 0, failed: 0, errors: [] };
    return (
      <StatusBox tone={summary.failed ? "warning" : "success"}>
        <p>
          {label} completada: {summary.processed} filas importadas,{" "}
          {summary.failed} con errores.
        </p>
        {summary.errors.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
            {summary.errors.map((error) => (
              <li key={error.row}>
                Fila {error.row}: {error.message}
              </li>
            ))}
          </ul>
        ) : null}
      </StatusBox>
    );
  }
  return (
    <StatusBox tone="pending">
      {label} {current.status === "queued" ? "en cola." : "en proceso…"}
    </StatusBox>
  );
}

export function ExportBatchStatus({
  batch,
  pollMs = DEFAULT_POLL_MS,
}: {
  batch: ExportBatch;
  pollMs?: number;
}) {
  const current = useBatch("exports", batch, crmApi.exports.get, pollMs);
  const label = "Exportación #" + current.id;

  if (current.status === "failed")
    return (
      <StatusBox tone="danger">
        {label} fallida: {current.error ?? "error desconocido"}
      </StatusBox>
    );
  if (current.status === "completed")
    return (
      <StatusBox tone="success">
        <p>
          {label} lista: {current.row_count ?? 0} filas.
        </p>
        {current.download_url ? (
          <a
            className="mt-1 inline-block font-semibold underline"
            href={current.download_url}
            rel="noreferrer"
            target="_blank"
          >
            Descargar archivo
          </a>
        ) : (
          <p className="mt-1 text-xs">
            El almacenamiento configurado no ofrece enlace de descarga.
          </p>
        )}
      </StatusBox>
    );
  return (
    <StatusBox tone="pending">
      {label} {current.status === "queued" ? "en cola." : "en proceso…"}
    </StatusBox>
  );
}

const tones = {
  pending: { className: "bg-surface-subtle text-muted", icon: LoaderCircle },
  success: { className: "text-success bg-emerald-50", icon: CheckCircle2 },
  warning: { className: "bg-amber-50 text-amber-700", icon: AlertCircle },
  danger: { className: "text-danger bg-rose-50", icon: AlertCircle },
};

function StatusBox({
  tone,
  children,
}: {
  tone: keyof typeof tones;
  children: ReactNode;
}) {
  const { className, icon: Icon } = tones[tone];
  return (
    <div
      className={"flex gap-2 rounded-xl p-3 text-sm " + className}
      role="status"
    >
      <Icon
        className={"shrink-0 " + (tone === "pending" ? "animate-spin" : "")}
        size={17}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
