"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Edit3 } from "lucide-react";
import { useState } from "react";
import {
  useDeleteLead,
  useFieldDefinitions,
  useLead,
  useUpdateLead,
} from "@/hooks/use-crm";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { RecordSummary } from "@/components/common/record-summary";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RecordForm } from "@/components/forms/record-form";
import { ConvertLeadDialog } from "@/features/leads/components/convert-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const lead = useLead(id);
  const fields = useFieldDefinitions("leads");
  const update = useUpdateLead();
  const remove = useDeleteLead();
  if (lead.isLoading) return <ListSkeleton rows={4} />;
  if (lead.isError || !lead.data)
    return (
      <ErrorState
        title="Lead no encontrado"
        description="Puede que no exista o que no tengas permiso para verlo."
        onRetry={() => void lead.refetch()}
      />
    );
  const item = lead.data;
  const name =
    `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() ||
    "Lead sin nombre";
  return (
    <>
      <PageHeader
        eyebrow="Leads"
        title={editing ? "Editar lead" : "Detalle del lead"}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/leads")}>
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
              kind="lead"
              onSubmit={async (values) => {
                await update.mutateAsync({ id, body: values });
                setEditing(false);
                await lead.refetch();
              }}
              submitLabel="Guardar lead"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <RecordSummary
            email={item.email}
            name={name}
            phone={item.phone}
            subtitle={item.source ? `Origen: ${item.source}` : "Lead potencial"}
          >
            <Button
              disabled={Boolean(item.converted_at)}
              onClick={() => setConvertOpen(true)}
            >
              <ArrowRight size={16} />
              {item.converted_at ? "Convertido" : "Convertir"}
            </Button>
            <Button variant="danger" onClick={() => setRemoveOpen(true)}>
              Eliminar
            </Button>
          </RecordSummary>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>Estado de calificación</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Info
                  label="Estado"
                  value={<StatusBadge value={item.status} />}
                />
                <Info label="Score" value={`${item.score ?? 0}/100`} />
                <Info label="Responsable" value={item.owner?.name} />
                <Info label="Creado" value={formatDate(item.created_at)} />
                <Info
                  label="Contacto vinculado"
                  value={
                    item.contact
                      ? `${item.contact.first_name} ${item.contact.last_name ?? ""}`
                      : undefined
                  }
                />
                <Info
                  label="Organización vinculada"
                  value={item.organization?.name}
                />
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
                    No hay campos adicionales.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <ConfirmDialog
        description="Se eliminará el lead y no podrá recuperarse desde este espacio."
        loading={remove.isPending}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          void remove.mutateAsync(id).then(() => router.replace("/leads"));
        }}
        open={removeOpen}
        title="Eliminar lead"
      />
      <ConvertLeadDialog
        leadId={id}
        onClose={() => setConvertOpen(false)}
        onComplete={() => void lead.refetch()}
        open={convertOpen}
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
