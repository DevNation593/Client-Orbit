"use client";

import Link from "next/link";
import { Database, Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { useCreateEntity, useEntityDefinitions } from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, EmptyState } from "@/components/common/async-state";
import { Can } from "@/components/common/can";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";

export default function EntitiesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", label: "" });
  const entities = useEntityDefinitions();
  const create = useCreateEntity();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await create.mutateAsync(form);
    setForm({ name: "", label: "" });
    setOpen(false);
  };
  return (
    <>
      <PageHeader
        eyebrow="Configuración flexible"
        title="Entidades"
        description="Crea módulos propios para propiedades, vehículos, pólizas, proyectos o cualquier proceso de tu industria."
        action={
          <Can permission="custom_entities.manage">
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} />
              Nueva entidad
            </Button>
          </Can>
        }
      />
      {entities.isError ? (
        <ErrorState onRetry={() => void entities.refetch()} />
      ) : entities.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {entities.data.map((entity) => (
            <Card className="transition-shadow hover:shadow-md" key={entity.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <span className="bg-brand-soft text-brand flex h-11 w-11 items-center justify-center rounded-2xl">
                    <Database size={21} />
                  </span>
                  <Link
                    aria-label={`Configurar ${entity.label}`}
                    className="text-muted hover:text-foreground rounded-lg p-2 hover:bg-slate-100"
                    href={`/settings/entities/${entity.id}`}
                  >
                    <Settings2 size={17} />
                  </Link>
                </div>
                <h2 className="mt-5 text-lg font-bold">{entity.label}</h2>
                <p className="text-muted mt-1 text-sm">
                  ID de definición: {entity.id}
                </p>
                <div className="border-border mt-5 flex items-center justify-between border-t pt-4">
                  <span className="text-muted text-xs">
                    {entity.fields?.length ?? 0} campos configurados
                  </span>
                  <Link
                    className="text-brand hover:text-brand-strong text-sm font-bold"
                    href={`/entities/${entity.id}`}
                  >
                    Abrir entidad
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <Can permission="custom_entities.manage">
              <Button onClick={() => setOpen(true)}>
                <Plus size={16} />
                Crear entidad
              </Button>
            </Can>
          }
          description="Configura una entidad para adaptar Vantex CRM a tu industria."
          title="Todavía no hay entidades"
        />
      )}
      <Dialog
        description="La entidad será un módulo dinámico basado en sus campos y registros."
        onClose={() => setOpen(false)}
        open={open}
        title="Crear entidad"
      >
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div>
            <Label htmlFor="entity-name">Nombre interno</Label>
            <Input
              id="entity-name"
              placeholder="Vehicle"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <FieldError />
          </div>
          <div>
            <Label htmlFor="entity-label">Etiqueta visible</Label>
            <Input
              id="entity-label"
              placeholder="Vehículos"
              required
              value={form.label}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  label: event.target.value,
                }))
              }
            />
          </div>
          {create.isError ? (
            <p className="text-danger rounded-xl bg-rose-50 p-3 text-sm">
              No se pudo crear la entidad. Revisa los datos e inténtalo de
              nuevo.
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={create.isPending} type="submit">
              {create.isPending ? "Creando…" : "Crear entidad"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
