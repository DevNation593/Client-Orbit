"use client";

import { useState } from "react";
import { Bot, MoreHorizontal, Plus, Zap } from "lucide-react";
import {
  useAutomations,
  useCreateAutomation,
  useDeleteAutomation,
} from "@/hooks/use-crm";
import { formatDate, titleCase } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, EmptyState } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AutomationsPage() {
  const [open, setOpen] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    event_type: "contact.created",
    conditionField: "",
    conditionOperator: "eq",
    conditionValue: "",
    actionType: "create_task",
    actionTitle: "Dar seguimiento",
  });
  const automations = useAutomations();
  const create = useCreateAutomation();
  const remove = useDeleteAutomation();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await create.mutateAsync({
      name: form.name,
      event_type: form.event_type,
      active: true,
      version: 1,
      config: {
        trigger: { type: form.event_type },
        conditions: form.conditionField
          ? [
              {
                field: form.conditionField,
                operator: form.conditionOperator,
                value: form.conditionValue,
              },
            ]
          : [],
        actions: [{ type: form.actionType, title: form.actionTitle }],
      },
    });
    setOpen(false);
    setForm({
      name: "",
      event_type: "contact.created",
      conditionField: "",
      conditionOperator: "eq",
      conditionValue: "",
      actionType: "create_task",
      actionTitle: "Dar seguimiento",
    });
  };
  return (
    <>
      <PageHeader
        eyebrow="Operación inteligente"
        title="Automatizaciones"
        description="Construye reglas declarativas; Laravel será quien las valide y ejecute."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Nueva automatización
          </Button>
        }
      />
      {automations.isError ? (
        <ErrorState onRetry={() => void automations.refetch()} />
      ) : automations.data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {automations.data.map((automation) => (
            <Card key={automation.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="bg-brand-soft text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Bot size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold">{automation.name}</h2>
                        <p className="text-muted mt-1 text-xs">
                          Cuando: {titleCase(automation.event_type)}
                        </p>
                      </div>
                      <Button
                        aria-label={`Acciones para ${automation.name}`}
                        size="icon"
                        variant="ghost"
                        onClick={() => setRemoveId(automation.id)}
                      >
                        <MoreHorizontal size={17} />
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        value={automation.active ? "active" : "inactive"}
                        label={automation.active ? "Activa" : "Pausada"}
                      />
                      <span className="text-muted text-xs">
                        v{automation.version ?? 1} ·{" "}
                        {automation.runs_count ?? 0} ejecuciones
                      </span>
                    </div>
                    <div className="bg-surface-subtle text-muted mt-4 flex items-center gap-2 rounded-xl p-3 text-xs">
                      <Zap className="text-brand" size={14} />
                      {Array.isArray(automation.config.actions)
                        ? `${automation.config.actions.length} acción(es) configurada(s)`
                        : "Configuración lista"}
                      <span className="ml-auto">
                        {formatDate(automation.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} />
              Crear automatización
            </Button>
          }
          description="Conecta triggers, condiciones y acciones para escalar tu operación."
          title="No hay automatizaciones"
        />
      )}
      <ConfirmDialog
        description="Se eliminará esta automatización. Las ejecuciones ya completadas no se modificarán."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove.mutateAsync(removeId).then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar automatización"
      />
      <Dialog
        className="max-w-2xl"
        description="El frontend construye la definición; el backend la valida y ejecuta."
        onClose={() => setOpen(false)}
        open={open}
        title="Crear automatización"
      >
        <form className="space-y-5" onSubmit={(event) => void submit(event)}>
          <div>
            <Label htmlFor="automation-name">Nombre</Label>
            <Input
              id="automation-name"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <BuilderStep icon={<Zap size={16} />} label="Trigger">
            <Select
              value={form.event_type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  event_type: event.target.value,
                }))
              }
            >
              <option value="contact.created">
                Cuando se crea un contacto
              </option>
              <option value="lead.created">Cuando se crea un lead</option>
              <option value="deal.stage_changed">
                Cuando cambia una oportunidad
              </option>
              <option value="task.completed">
                Cuando se completa una tarea
              </option>
            </Select>
          </BuilderStep>
          <BuilderStep
            icon={<span className="font-bold">SI</span>}
            label="Condición (opcional)"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="Campo, p. ej. score"
                value={form.conditionField}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    conditionField: event.target.value,
                  }))
                }
              />
              <Select
                value={form.conditionOperator}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    conditionOperator: event.target.value,
                  }))
                }
              >
                <option value="eq">es igual a</option>
                <option value="gt">es mayor que</option>
                <option value="contains">contiene</option>
              </Select>
              <Input
                placeholder="Valor"
                value={form.conditionValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    conditionValue: event.target.value,
                  }))
                }
              />
            </div>
          </BuilderStep>
          <BuilderStep
            icon={<span className="font-bold">→</span>}
            label="Acción"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                value={form.actionType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    actionType: event.target.value,
                  }))
                }
              >
                <option value="create_task">Crear tarea</option>
                <option value="assign_owner">Asignar responsable</option>
                <option value="send_email">Enviar correo</option>
              </Select>
              <Input
                placeholder="Descripción de la acción"
                value={form.actionTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    actionTitle: event.target.value,
                  }))
                }
              />
            </div>
          </BuilderStep>
          <div className="border-border flex justify-end gap-2 border-t pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={create.isPending} type="submit">
              {create.isPending ? "Guardando…" : "Guardar automatización"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function BuilderStep({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border flex gap-3 rounded-2xl border p-4">
      <span className="bg-brand-soft text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-muted mb-2 text-xs font-bold tracking-wide uppercase">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}
