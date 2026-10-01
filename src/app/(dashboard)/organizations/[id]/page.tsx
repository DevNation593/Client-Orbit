"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3 } from "lucide-react";
import { useState } from "react";
import {
  useDeleteOrganization,
  useFieldDefinitions,
  useOrganization,
  useUpdateOrganization,
} from "@/hooks/use-crm";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { RecordSummary } from "@/components/common/record-summary";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RecordForm } from "@/components/forms/record-form";
import { Avatar } from "@/components/common/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const organization = useOrganization(id);
  const fields = useFieldDefinitions("organizations");
  const update = useUpdateOrganization();
  const remove = useDeleteOrganization();
  if (organization.isLoading) return <ListSkeleton rows={4} />;
  if (organization.isError || !organization.data)
    return (
      <ErrorState
        title="Organización no encontrada"
        description="Puede que no exista o que no tengas permiso para verla."
        onRetry={() => void organization.refetch()}
      />
    );
  const item = organization.data;
  return (
    <>
      <PageHeader
        eyebrow="Organizaciones"
        title={editing ? "Editar organización" : "Detalle de la organización"}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/organizations")}
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
            <RecordForm
              customFields={fields.data ?? []}
              defaultValues={{
                ...item,
                custom_fields: item.custom_fields ?? {},
              }}
              kind="organization"
              onSubmit={async (values) => {
                await update.mutateAsync({ id, body: values });
                setEditing(false);
                await organization.refetch();
              }}
              submitLabel="Guardar organización"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <RecordSummary
            email={item.email}
            name={item.name}
            phone={item.phone}
            subtitle={item.legal_name ?? "Empresa"}
          >
            <Button variant="danger" onClick={() => setRemoveOpen(true)}>
              Eliminar
            </Button>
          </RecordSummary>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Info label="Nombre comercial" value={item.name} />
                <Info label="Razón social" value={item.legal_name} />
                <Info label="Correo" value={item.email} />
                <Info label="Teléfono" value={item.phone} />
                <Info label="Sitio web" value={item.website} />
                <Info label="Responsable" value={item.owner?.name} />
                <Info label="Creada" value={formatDate(item.created_at)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Contactos asociados</CardTitle>
                  <p className="text-muted mt-1 text-xs">
                    Personas relacionadas con esta organización
                  </p>
                </div>
                <Link className="text-brand text-xs font-bold" href="/contacts">
                  Ver contactos
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.contacts?.length ? (
                  item.contacts.map((contact) => (
                    <Link
                      className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-2.5"
                      href={`/contacts/${contact.id}`}
                      key={contact.id}
                    >
                      <Avatar
                        name={`${contact.first_name} ${contact.last_name ?? ""}`}
                        size="sm"
                      />
                      <span className="text-sm font-semibold">
                        {contact.first_name} {contact.last_name}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted py-8 text-center text-sm">
                    No hay contactos asociados todavía.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <ConfirmDialog
        description="Se eliminará la organización y se desvincularán sus relaciones. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          void remove
            .mutateAsync(id)
            .then(() => router.replace("/organizations"));
        }}
        open={removeOpen}
        title="Eliminar organización"
      />
    </>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-muted text-xs font-bold tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold break-words">{value || "—"}</p>
    </div>
  );
}
