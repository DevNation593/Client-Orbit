"use client";

import { useParams, useRouter } from "next/navigation";
import { useCreateEntityRecord, useEntityDefinition } from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/components/forms/dynamic-form";

export default function NewEntityRecordPage() {
  const { entityId: entityIdParam } = useParams<{ entityId: string }>();
  const entityId = Number(entityIdParam);
  const router = useRouter();
  const definition = useEntityDefinition(entityId);
  const create = useCreateEntityRecord();
  if (definition.isLoading) return <ListSkeleton rows={3} />;
  if (definition.isError || !definition.data)
    return (
      <ErrorState
        title="Entidad no encontrada"
        description="No se pudo cargar la definición de campos."
      />
    );
  return (
    <>
      <PageHeader
        eyebrow={definition.data.label}
        title={`Nuevo ${definition.data.label.toLowerCase()}`}
        description="Completa el formulario generado a partir de la configuración de esta entidad."
        action={
          <Button variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
        }
      />
      <Card>
        <CardContent className="p-5 md:p-7">
          <DynamicForm
            fields={definition.data.fields ?? []}
            onSubmit={async (values) => {
              const record = await create.mutateAsync({
                entityDefinitionId: entityId,
                body: { data: values },
              });
              router.replace(`/entities/${entityId}/${record.id}`);
            }}
            submitLabel="Crear registro"
          />
        </CardContent>
      </Card>
    </>
  );
}
