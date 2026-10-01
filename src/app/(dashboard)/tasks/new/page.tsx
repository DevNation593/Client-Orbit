"use client";

import { useRouter } from "next/navigation";
import { useCreateTask, useFieldDefinitions } from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RecordForm } from "@/components/forms/record-form";
import { Button } from "@/components/ui/button";

export default function NewTaskPage() {
  const router = useRouter();
  const fields = useFieldDefinitions("tasks");
  const create = useCreateTask();
  return (
    <>
      <PageHeader
        eyebrow="Tareas"
        title="Nueva tarea"
        description="Define el siguiente paso, su prioridad y fecha de vencimiento."
        action={
          <Button variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
        }
      />
      <Card>
        <CardContent className="p-5 md:p-7">
          <RecordForm
            customFields={fields.data ?? []}
            kind="task"
            onSubmit={async (values) => {
              const task = await create.mutateAsync(values);
              router.replace(`/tasks/${task.id}`);
            }}
            submitLabel="Crear tarea"
          />
        </CardContent>
      </Card>
    </>
  );
}
