"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import type { AuditLog } from "@/types/domain";
import { apiClient } from "@/lib/api/client";
import { formatDate, titleCase } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";

export default function AuditSettingsPage() {
  const logs = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () =>
      apiClient.requestEnvelope<AuditLog[]>("audit-logs", {
        method: "GET",
        query: { per_page: 50 },
      }),
  });
  return (
    <>
      <PageHeader
        eyebrow="Seguridad"
        title="Auditoría"
        description="Consulta el historial inmutable de cambios relevantes en tu organización."
      />
      {logs.isError ? (
        <ErrorState onRetry={() => void logs.refetch()} />
      ) : logs.isLoading ? (
        <ListSkeleton rows={6} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-border divide-y">
              {logs.data?.data.map((log) => (
                <div className="flex gap-3 px-5 py-4" key={log.id}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <ShieldCheck size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {titleCase(log.action)} ·{" "}
                        {log.auditable_type ?? "Sistema"}
                      </p>
                      <time className="text-muted text-xs">
                        {formatDate(log.created_at)}
                      </time>
                    </div>
                    <p className="text-muted mt-1 text-xs">
                      {log.user?.name ?? "Sistema"} · registro{" "}
                      {log.auditable_id ?? "—"}
                    </p>
                  </div>
                  <StatusBadge value="completed" label="Registrado" />
                </div>
              ))}
              {!logs.data?.data.length ? (
                <p className="text-muted p-8 text-center text-sm">
                  No hay eventos de auditoría.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
