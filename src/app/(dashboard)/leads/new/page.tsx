"use client";

import { useRouter } from "next/navigation";
import { useCreateLead, useFieldDefinitions } from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RecordForm } from "@/components/forms/record-form";
import { Button } from "@/components/ui/button";

export default function NewLeadPage() {
  const router = useRouter();
  const fields = useFieldDefinitions("leads");
  const create = useCreateLead();
  return (
    <>
      <PageHeader
        eyebrow="Leads"
        title="Nuevo lead"
        description="Captura una oportunidad potencial y prepara el siguiente paso."
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
            kind="lead"
            onSubmit={async (values) => {
              const lead = await create.mutateAsync(values);
              router.replace(`/leads/${lead.id}`);
            }}
            submitLabel="Crear lead"
          />
        </CardContent>
      </Card>
    </>
  );
}
