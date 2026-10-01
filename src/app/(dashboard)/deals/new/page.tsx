"use client";

import { useRouter } from "next/navigation";
import {
  useCreateDeal,
  useFieldDefinitions,
  usePipelines,
} from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RecordForm } from "@/components/forms/record-form";
import { Button } from "@/components/ui/button";

export default function NewDealPage() {
  const router = useRouter();
  const fields = useFieldDefinitions("deals");
  const pipelines = usePipelines();
  const create = useCreateDeal();
  return (
    <>
      <PageHeader
        eyebrow="Oportunidades"
        title="Nueva oportunidad"
        description="Registra un negocio y ubícalo en la etapa correcta del pipeline."
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
            kind="deal"
            onSubmit={async (values) => {
              const deal = await create.mutateAsync(values);
              router.replace(`/deals/${deal.id}`);
            }}
            pipelines={pipelines.data ?? []}
            submitLabel="Crear oportunidad"
          />
        </CardContent>
      </Card>
    </>
  );
}
