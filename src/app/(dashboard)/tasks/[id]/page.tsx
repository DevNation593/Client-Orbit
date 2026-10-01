"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { useState } from "react";
import {
  useDeleteTask,
  useFieldDefinitions,
  useTask,
  useUpdateTask,
} from "@/hooks/use-crm";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { RecordSummary } from "@/components/common/record-summary";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RecordForm } from "@/components/forms/record-form";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const task = useTask(id);
  const fields = useFieldDefinitions("tasks");
  const update = useUpdateTask();
  const remove = useDeleteTask();
  if (task.isLoading) return <ListSkeleton rows={4} />;
  if (task.isError || !task.data)
    return (
      <ErrorState
        title="Tarea no encontrada"
        description="Puede que no exista o que no tengas permiso para verla."
        onRetry={() => void task.refetch()}
      />
    );
  const item = task.data;
  return (
    <>
      <PageHeader
        eyebrow="Tareas"
        title={editing ? "Editar tarea" : "Detalle de la tarea"}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/tasks")}>
              <ArrowLeft size={16} />
              Volver
            </Button>
            {!editing ? (
              <Button onClick={() => setEditing(true)}>
                <Edit3 size={16} />
                Editar
              </Button>
            ) : null}
          </div>
        }
      />
      {editing ? (
        <Card>
          <CardContent className="p-5 md:p-7">
            <RecordForm
              customFields={fields.data ?? []}
              defaultValues={{
                ...item,
                custom_fields: item.custom_fields ?? {},
              }}
              kind="task"
              onSubmit={async (values) => {
                await update.mutateAsync({ id, body: values });
                setEditing(false);
                await task.refetch();
              }}
              submitLabel="Guardar tarea"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <RecordSummary
            name={item.title}
            subtitle={`Vence: ${formatDate(item.due_at)}`}
          >
            <Button variant="danger" onClick={() => setRemoveOpen(true)}>
              Eliminar
            </Button>
          </RecordSummary>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>Seguimiento</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Info
                  label="Estado"
                  value={<StatusBadge value={item.status} />}
                />
                <Info
                  label="Prioridad"
                  value={<StatusBadge value={item.priority} />}
                />
                <Info label="Asignada a" value={item.assignee?.name} />
                <Info label="Creada por" value={item.creator?.name} />
                <Info label="Vencimiento" value={formatDate(item.due_at)} />
                <Info
                  label="Relación"
                  value={
                    item.related_type
                      ? `${item.related_type} · ${item.related_id}`
                      : undefined
                  }
                />
                <div className="sm:col-span-2">
                  <p className="text-muted text-xs font-bold tracking-wide uppercase">
                    Descripción
                  </p>
                  <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">
                    {item.description || "Sin descripción."}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Campos personalizados</CardTitle>
              </CardHeader>
              <CardContent>
                {item.custom_fields &&
                Object.keys(item.custom_fields).length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(item.custom_fields).map(([key, value]) => (
                      <Info
                        key={key}
                        label={key.replaceAll("_", " ")}
                        value={String(value ?? "—")}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm">
                    No hay campos personalizados.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <ConfirmDialog
        description="Se eliminará la tarea y su historial. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          void remove.mutateAsync(id).then(() => router.replace("/tasks"));
        }}
        open={removeOpen}
        title="Eliminar tarea"
      />
    </>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted text-xs font-bold tracking-wide uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold">{value || "—"}</div>
    </div>
  );
}
