"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useEntityDefinition,
  useUpdateEntityRecord,
  useDeleteEntityRecord,
} from "@/hooks/use-crm";
import { crmApi } from "@/lib/api/resources";
import type { EntityRecord } from "@/types/domain";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EntityRecordDetailPage() {
  const { entityId: entityIdParam, recordId } = useParams<{
    entityId: string;
    recordId: string;
  }>();
  const entityId = Number(entityIdParam);
  const id = Number(recordId);
  const router = useRouter();
  const [record, setRecord] = useState<EntityRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const definition = useEntityDefinition(entityId);
  const update = useUpdateEntityRecord();
  const remove = useDeleteEntityRecord();
  useEffect(() => {
    if (!Number.isFinite(entityId) || !Number.isFinite(id)) return;
    setRecordLoading(true);
    void crmApi.entities.records
      .get(entityId, id)
      .then(setRecord)
      .catch(() => setRecord(null))
      .finally(() => setRecordLoading(false));
  }, [entityId, id]);
  if (definition.isLoading || recordLoading) return <ListSkeleton rows={3} />;
  if (definition.isError || !definition.data || !record)
    return (
      <ErrorState
        title="Registro no encontrado"
        description="El registro puede haber sido eliminado o no tienes acceso."
      />
    );
  return (
    <>
      <PageHeader
        eyebrow={definition.data.label}
        title={`Registro #${record.id}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push(`/entities/${entityId}`)}
            >
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
            <DynamicForm
              defaultValues={record.data}
              fields={definition.data.fields ?? []}
              onSubmit={async (values) => {
                const next = await update.mutateAsync({
                  entityDefinitionId: entityId,
                  id,
                  body: { data: values },
                });
                setRecord(next);
                setEditing(false);
              }}
              submitLabel="Guardar registro"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Información del registro</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {(definition.data.fields ?? []).map((field) => (
                <Info
                  key={field.id}
                  label={field.label}
                  value={formatValue(record.data[field.name])}
                />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Metadatos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Info label="ID" value={String(record.id)} />
              <Info
                label="Creado"
                value={
                  record.created_at
                    ? new Date(record.created_at).toLocaleString("es-EC")
                    : "—"
                }
              />
              <Info
                label="Última actualización"
                value={
                  record.updated_at
                    ? new Date(record.updated_at).toLocaleString("es-EC")
                    : "—"
                }
              />
              <Button
                className="mt-3"
                variant="danger"
                onClick={() => setRemoveOpen(true)}
              >
                Eliminar registro
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      <ConfirmDialog
        description="Se eliminará este registro de la entidad dinámica. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          void remove
            .mutateAsync({ entityDefinitionId: entityId, id })
            .then(() => router.replace(`/entities/${entityId}`));
        }}
        open={removeOpen}
        title="Eliminar registro"
      />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted text-xs font-bold tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold break-words">{value || "—"}</p>
    </div>
  );
}
function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
