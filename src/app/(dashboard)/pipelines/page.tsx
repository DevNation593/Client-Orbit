"use client";

import Link from "next/link";
import { GitBranch, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import {
  useCreatePipeline,
  useDeletePipeline,
  usePipelines,
} from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, EmptyState } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PipelinesPage() {
  const [open, setOpen] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    stages: "Nuevo\nContactado\nPropuesta\nGanado",
  });
  const pipelines = usePipelines();
  const create = useCreatePipeline();
  const remove = useDeletePipeline();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const stageNames = form.stages
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
    await create.mutateAsync({
      name: form.name,
      description: form.description,
      active: true,
      is_default: !pipelines.data?.length,
      stages: stageNames.map((name, index) => ({
        name,
        position: index + 1,
        probability: Math.min(
          100,
          (index + 1) * Math.round(100 / Math.max(1, stageNames.length)),
        ),
      })),
    });
    setOpen(false);
    setForm({
      name: "",
      description: "",
      stages: "Nuevo\nContactado\nPropuesta\nGanado",
    });
  };
  return (
    <>
      <PageHeader
        eyebrow="Ingresos"
        title="Pipelines"
        description="Configura etapas dinámicas para distintos procesos comerciales o industriales."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Nuevo pipeline
          </Button>
        }
      />
      {pipelines.isError ? (
        <ErrorState onRetry={() => void pipelines.refetch()} />
      ) : pipelines.data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {pipelines.data.map((pipeline) => (
            <Card key={pipeline.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <span className="bg-brand-soft text-brand flex h-11 w-11 items-center justify-center rounded-2xl">
                    <GitBranch size={21} />
                  </span>
                  <Button
                    aria-label={`Eliminar ${pipeline.name}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => setRemoveId(pipeline.id)}
                  >
                    <MoreHorizontal size={17} />
                  </Button>
                </div>
                <div className="mt-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{pipeline.name}</h2>
                    <p className="text-muted mt-1 text-sm">
                      {pipeline.description ?? "Sin descripción"}
                    </p>
                  </div>
                  {pipeline.is_default ? (
                    <span className="text-success rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold">
                      Predeterminado
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {pipeline.stages.map((stage) => (
                    <span
                      className="border-border bg-surface-subtle rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                      key={stage.id}
                    >
                      {stage.name}
                    </span>
                  ))}
                </div>
                <Link
                  className="text-brand hover:text-brand-strong mt-5 inline-flex text-sm font-bold"
                  href={`/deals?pipeline=${pipeline.id}`}
                >
                  Ver oportunidades →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} />
              Crear pipeline
            </Button>
          }
          description="Los pipelines controlan las etapas que aparecen en el tablero de oportunidades."
          title="No hay pipelines"
        />
      )}
      <ConfirmDialog
        description="Se eliminará el pipeline y sus etapas. Las oportunidades existentes deben reubicarse antes de continuar."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove.mutateAsync(removeId).then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar pipeline"
      />
      <Dialog
        description="Las etapas se guardan en el backend y se muestran dinámicamente en el tablero."
        onClose={() => setOpen(false)}
        open={open}
        title="Crear pipeline"
      >
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div>
            <Label htmlFor="pipeline-name">Nombre</Label>
            <Input
              id="pipeline-name"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="pipeline-description">Descripción</Label>
            <Textarea
              id="pipeline-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="pipeline-stages">
              Etapas{" "}
              <span className="text-muted font-normal">(una por línea)</span>
            </Label>
            <Textarea
              id="pipeline-stages"
              required
              value={form.stages}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  stages: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={create.isPending} type="submit">
              {create.isPending ? "Creando…" : "Crear pipeline"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
