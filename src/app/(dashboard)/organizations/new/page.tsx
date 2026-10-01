"use client";

import { useRouter } from "next/navigation";
import { useCreateOrganization, useFieldDefinitions } from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RecordForm } from "@/components/forms/record-form";
import { Button } from "@/components/ui/button";

export default function NewOrganizationPage() {
  const router = useRouter();
  const fields = useFieldDefinitions("organizations");
  const create = useCreateOrganization();
  return (
    <>
      <PageHeader
        eyebrow="Organizaciones"
        title="Nueva organización"
        description="Registra una empresa para centralizar sus contactos, oportunidades y actividad."
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
            kind="organization"
            onSubmit={async (values) => {
              const organization = await create.mutateAsync(values);
              router.replace(`/organizations/${organization.id}`);
            }}
            submitLabel="Crear organización"
          />
        </CardContent>
      </Card>
    </>
  );
}
