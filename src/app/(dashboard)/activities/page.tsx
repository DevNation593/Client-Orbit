"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useActivities, useCreateActivity } from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { ActivityTimeline } from "@/components/common/timeline";
import { ErrorState } from "@/components/common/async-state";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ActivitiesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "note", subject: "", body: "" });
  const activities = useActivities({ page: 1, per_page: 50 });
  const create = useCreateActivity();
  return (
    <>
      <PageHeader
        eyebrow="Operación"
        title="Actividad"
        description="Consulta llamadas, reuniones, notas, correos y eventos del espacio."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Registrar actividad
          </Button>
        }
      />
      {activities.isError ? (
        <ErrorState onRetry={() => void activities.refetch()} />
      ) : (
        <div className="border-border max-w-3xl rounded-2xl border bg-white p-5 md:p-7">
          <ActivityTimeline
            activities={activities.data?.items ?? []}
            loading={activities.isLoading}
          />
        </div>
      )}
      <Dialog
        description="Registra una interacción para mantener el contexto del equipo."
        onClose={() => setOpen(false)}
        open={open}
        title="Registrar actividad"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void create.mutateAsync(form).then(() => {
              setOpen(false);
              setForm({ type: "note", subject: "", body: "" });
              void activities.refetch();
            });
          }}
        >
          <div>
            <Label htmlFor="activity-type">Tipo</Label>
            <Select
              id="activity-type"
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({ ...current, type: event.target.value }))
              }
            >
              <option value="note">Nota</option>
              <option value="call">Llamada</option>
              <option value="meeting">Reunión</option>
              <option value="email">Correo</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="activity-subject">Asunto</Label>
            <Input
              id="activity-subject"
              value={form.subject}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="activity-body">Detalle</Label>
            <Textarea
              id="activity-body"
              required
              value={form.body}
              onChange={(event) =>
                setForm((current) => ({ ...current, body: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={create.isPending} type="submit">
              {create.isPending ? "Guardando…" : "Guardar actividad"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
