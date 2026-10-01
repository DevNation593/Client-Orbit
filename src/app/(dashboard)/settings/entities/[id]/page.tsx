"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import {
  useDeleteEntity,
  useEntityDefinitions,
  useUpdateEntity,
} from "@/hooks/use-crm";
import { titleCase } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EntitySettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const entityId = Number(id);
  const [removeOpen, setRemoveOpen] = useState(false);
  const entities = useEntityDefinitions();
  const update = useUpdateEntity();
  const remove = useDeleteEntity();
  const entity = entities.data?.find((entry) => entry.id === entityId);
  if (entities.isLoading) return <ListSkeleton rows={3} />;
  if (entities.isError || !entity)
    return (
      <ErrorState
        title="Entidad no encontrada"
        description="No se pudo cargar la configuración de esta entidad."
        onRetry={() => void entities.refetch()}
      />
    );
  return (
    <>
      <PageHeader
        eyebrow="Configuración · Entidades"
        title={entity.label}
        description={`Administra la definición de ${entity.name} y sus campos.`}
        action={
          <Button variant="secondary" onClick={() => router.push("/entities")}>
            <ArrowLeft size={16} />
            Volver
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Definición</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="entity-label">Etiqueta</Label>
              <Input
                defaultValue={entity.label}
                id="entity-label"
                onBlur={(event) => {
                  if (event.target.value !== entity.label)
                    void update.mutateAsync({
                      id: entity.id,
                      body: { label: event.target.value },
                    });
                }}
              />
            </div>
            <div>
              <Label htmlFor="entity-name">Nombre interno</Label>
              <Input
                defaultValue={entity.name}
                id="entity-name"
                onBlur={(event) => {
                  if (event.target.value !== entity.name)
                    void update.mutateAsync({
                      id: entity.id,
                      body: { name: event.target.value },
                    });
                }}
              />
            </div>
            <div className="border-border flex justify-end border-t pt-4">
              <Button variant="danger" onClick={() => setRemoveOpen(true)}>
                Eliminar entidad
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Campos activos</CardTitle>
              <p className="text-muted mt-1 text-xs">
                Los campos controlan la tabla y el formulario dinámico.
              </p>
            </div>
            <Link
              className="text-brand inline-flex items-center gap-1.5 text-xs font-bold"
              href={`/settings/fields?entity_definition_id=${entity.id}`}
            >
              <Plus size={14} />
              Añadir campo
            </Link>
          </CardHeader>
          <CardContent>
            {entity.fields?.length ? (
              <div className="space-y-2">
                {entity.fields.map((field) => (
                  <div
                    className="border-border flex items-center justify-between rounded-xl border p-3"
                    key={field.id}
                  >
                    <div>
                      <p className="text-sm font-semibold">{field.label}</p>
                      <p className="text-muted mt-0.5 text-xs">
                        {field.name} · {titleCase(field.type)}
                      </p>
                    </div>
                    <span className="text-muted text-xs">
                      {field.required ? "Obligatorio" : "Opcional"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="bg-surface-subtle text-muted rounded-xl p-6 text-center text-sm">
                Todavía no hay campos. Añade el primero desde Campos
                personalizados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        description="Se eliminará la entidad, sus campos y sus registros asociados. Esta acción no se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          void remove
            .mutateAsync(entity.id)
            .then(() => router.replace("/entities"));
        }}
        open={removeOpen}
        title="Eliminar entidad"
      />
    </>
  );
}
