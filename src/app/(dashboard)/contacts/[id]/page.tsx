"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckSquare,
  Edit3,
  Mail,
  MessageCircle,
  Phone,
  Plus,
} from "lucide-react";
import { useState } from "react";
import {
  useContact,
  useContactOverview,
  useContactTimeline,
  useCreateActivity,
  useDeleteContact,
  useFieldDefinitions,
  useUpdateContact,
} from "@/hooks/use-crm";
import { timelineEventToEntry } from "@/features/customer360/timeline";
import { ContactDuplicates } from "@/features/duplicates/contact-duplicates";
import { RecordTags } from "@/features/tags/record-tags";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { RecordSummary } from "@/components/common/record-summary";
import {
  ActivityTimeline,
  TimelineComposer,
} from "@/components/common/timeline";
import { Customer360Panels } from "@/components/common/customer360";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { RecordForm } from "@/components/forms/record-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const contact = useContact(id);
  const fields = useFieldDefinitions("contacts");
  const overview = useContactOverview(id);
  const timeline = useContactTimeline(id);
  const update = useUpdateContact();
  const remove = useDeleteContact();
  const createActivity = useCreateActivity();
  if (contact.isLoading) return <ListSkeleton rows={4} />;
  if (contact.isError || !contact.data)
    return (
      <ErrorState
        title="Contacto no encontrado"
        description="Puede que no exista o que no tengas permiso para verlo."
        onRetry={() => void contact.refetch()}
      />
    );
  const item = contact.data;
  const fullName = `${item.first_name} ${item.last_name ?? ""}`.trim();
  const timelineEntries =
    timeline.data?.pages.flatMap((page) =>
      page.items.map(timelineEventToEntry),
    ) ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Contactos"
        title={editing ? "Editar contacto" : "Detalle del contacto"}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/contacts")}
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
              kind="contact"
              onSubmit={async (values) => {
                await update.mutateAsync({ id, body: values });
                setEditing(false);
                await contact.refetch();
              }}
              submitLabel="Guardar contacto"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <RecordSummary
            email={item.email}
            name={fullName}
            phone={item.phone}
            subtitle={item.organizations?.[0]?.name ?? "Contacto individual"}
          >
            <div className="flex flex-wrap justify-end gap-2">
              {item.email ? (
                <a
                  className={buttonVariants({
                    size: "sm",
                    variant: "secondary",
                  })}
                  href={"mailto:" + item.email}
                >
                  <Mail size={15} />
                  Correo
                </a>
              ) : null}
              {item.phone ? (
                <a
                  className={buttonVariants({
                    size: "sm",
                    variant: "secondary",
                  })}
                  href={"tel:" + item.phone}
                >
                  <Phone size={15} />
                  Llamar
                </a>
              ) : null}
              {item.phone ? (
                <a
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  href={"https://wa.me/" + item.phone.replace(/\D/g, "")}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
              ) : null}
              <Link
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href="/tasks/new"
              >
                <CheckSquare size={15} />
                Nueva tarea
              </Link>
              <Link
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href="/deals/new"
              >
                <BriefcaseBusiness size={15} />
                Nueva oportunidad
              </Link>
              <Button
                onClick={() => setRemoveOpen(true)}
                size="sm"
                variant="danger"
              >
                Eliminar
              </Button>
            </div>
          </RecordSummary>
          <ContactDuplicates contact={item} />
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Info label="Nombre completo" value={fullName} />
                <Info label="Correo" value={item.email} />
                <Info label="Teléfono" value={item.phone} />
                <Info label="Estado" value={item.status} />
                <Info label="Responsable" value={item.owner?.name} />
                <Info label="Creado" value={formatDate(item.created_at)} />
                <div className="sm:col-span-2">
                  <p className="text-muted mb-2 text-xs font-bold tracking-wide uppercase">
                    Campos personalizados
                  </p>
                  {item.custom_fields &&
                  Object.keys(item.custom_fields).length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
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
                      No hay campos adicionales.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <RecordTags entityId={item.id} entityType="contact" />
                </div>
              </CardContent>
            </Card>
            <Card id="activity">
              <CardHeader>
                <div>
                  <CardTitle>Actividad</CardTitle>
                  <p className="text-muted mt-1 text-xs">
                    Historial de interacciones y cambios
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActivityOpen(true)}
                >
                  <Plus size={15} />
                  Registrar actividad
                </Button>
              </CardHeader>
              <CardContent>
                {timeline.isError ? (
                  <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm">
                    No se pudo cargar la actividad del contacto.
                  </p>
                ) : (
                  <ActivityTimeline
                    activities={timelineEntries}
                    hasMore={timeline.hasNextPage}
                    loading={timeline.isLoading}
                    loadingMore={timeline.isFetchingNextPage}
                    onLoadMore={() => void timeline.fetchNextPage()}
                  />
                )}
              </CardContent>
            </Card>
          </div>
          {overview.isError ? (
            <p className="text-danger mt-6 rounded-xl bg-rose-50 px-3 py-2.5 text-sm">
              No se pudieron cargar los registros relacionados del contacto.
            </p>
          ) : (
            <Customer360Panels
              contact={item}
              loading={overview.isLoading}
              modules={overview.data?.modules}
            />
          )}
        </>
      )}
      <ConfirmDialog
        description="Esta acción eliminará el contacto y sus relaciones desde este espacio. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          void remove.mutateAsync(id).then(() => router.replace("/contacts"));
        }}
        open={removeOpen}
        title="Eliminar contacto"
      />
      <Dialog
        description="Registra una llamada, reunión, correo o nota sin salir del contacto."
        onClose={() => setActivityOpen(false)}
        open={activityOpen}
        title="Registrar actividad"
      >
        <TimelineComposer
          disabled={createActivity.isPending}
          onSubmit={async (values) => {
            await createActivity.mutateAsync({
              ...values,
              activityable_type: "contact",
              activityable_id: String(id),
            });
            await timeline.refetch();
            setActivityOpen(false);
          }}
        />
      </Dialog>
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
      <p className="text-foreground mt-1 text-sm font-semibold">
        {value || "—"}
      </p>
    </div>
  );
}
