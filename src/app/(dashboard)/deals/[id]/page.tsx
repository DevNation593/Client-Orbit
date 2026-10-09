"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { useState } from "react";
import {
  useDeal,
  useDeleteDeal,
  useFieldDefinitions,
  usePipelines,
  useUpdateDeal,
} from "@/hooks/use-crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RecordTags } from "@/features/tags/record-tags";
import { PageHeader } from "@/components/common/page-header";
import { RecordSummary } from "@/components/common/record-summary";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RecordForm } from "@/components/forms/record-form";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const deal = useDeal(id);
  const fields = useFieldDefinitions("deals");
  const pipelines = usePipelines();
  const update = useUpdateDeal();
  const remove = useDeleteDeal();
  if (deal.isLoading) return <ListSkeleton rows={4} />;
  if (deal.isError || !deal.data)
    return (
      <ErrorState
        title="Oportunidad no encontrada"
        description="Puede que no exista o que no tengas permiso para verla."
        onRetry={() => void deal.refetch()}
      />
    );
  const item = deal.data;
  return (
    <>
      <PageHeader
        eyebrow="Oportunidades"
        title={editing ? "Editar oportunidad" : "Detalle de la oportunidad"}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/deals")}>
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
              kind="deal"
              onSubmit={async (values) => {
                await update.mutateAsync({ id, body: values });
                setEditing(false);
                await deal.refetch();
              }}
              pipelines={pipelines.data ?? []}
              submitLabel="Guardar oportunidad"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <RecordSummary
            name={item.name}
            subtitle={`${item.pipeline?.name ?? "Pipeline"} · ${item.stage?.name ?? "Sin etapa"}`}
          >
            <Button variant="danger" onClick={() => setRemoveOpen(true)}>
              Eliminar
            </Button>
          </RecordSummary>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>Resumen financiero</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Info
                  label="Valor"
                  value={formatCurrency(item.value, item.currency)}
                />
                <Info
                  label="Estado"
                  value={<StatusBadge value={item.status} />}
                />
                <Info label="Pipeline" value={item.pipeline?.name} />
                <Info label="Etapa" value={item.stage?.name} />
                <Info label="Responsable" value={item.owner?.name} />
                <Info
                  label="Cierre estimado"
                  value={formatDate(item.expected_close_date)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Relaciones y campos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Info
                  label="Contacto"
                  value={
                    item.contact
                      ? `${item.contact.first_name} ${item.contact.last_name ?? ""}`
                      : undefined
                  }
                />
                <Info label="Organización" value={item.organization?.name} />
                <div className="sm:col-span-2">
                  {item.custom_fields &&
                  Object.keys(item.custom_fields).length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(item.custom_fields).map(
                        ([key, value]) => (
                          <Info
                            key={key}
                            label={key.replaceAll("_", " ")}
                            value={String(value ?? "—")}
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-muted text-sm">
                      No hay campos personalizados.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <RecordTags entityId={item.id} entityType="deal" />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <ConfirmDialog
        description="Se eliminará esta oportunidad del pipeline. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          void remove.mutateAsync(id).then(() => router.replace("/deals"));
        }}
        open={removeOpen}
        title="Eliminar oportunidad"
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
