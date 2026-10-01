"use client";

import { useRouter } from "next/navigation";
import { useCreateContact, useFieldDefinitions } from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RecordForm } from "@/components/forms/record-form";
import { Button } from "@/components/ui/button";

export default function NewContactPage() {
  const router = useRouter();
  const fields = useFieldDefinitions("contacts");
  const create = useCreateContact();
  return (
    <>
      <PageHeader
        eyebrow="Contactos"
        title="Nuevo contacto"
        description="Añade una persona y completa la información relevante para tu equipo."
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
            kind="contact"
            onSubmit={async (values) => {
              const contact = await create.mutateAsync(values);
              router.replace(`/contacts/${contact.id}`);
            }}
            submitLabel="Crear contacto"
          />
        </CardContent>
      </Card>
    </>
  );
}
