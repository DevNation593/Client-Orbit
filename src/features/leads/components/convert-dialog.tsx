"use client";

import { useState } from "react";
import { useConvertLead, usePipelines } from "@/hooks/use-crm";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";

export function ConvertLeadDialog({
  leadId,
  open,
  onClose,
  onComplete,
}: {
  leadId: number;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [createContact, setCreateContact] = useState(true);
  const [createOrganization, setCreateOrganization] = useState(false);
  const [createDeal, setCreateDeal] = useState(true);
  const [deal, setDeal] = useState({
    name: "",
    pipeline_id: "",
    stage_id: "",
    value: "0",
    currency: "USD",
  });
  const convert = useConvertLead();
  const pipelines = usePipelines();
  const selectedPipeline =
    pipelines.data?.find(
      (pipeline) => String(pipeline.id) === deal.pipeline_id,
    ) ?? pipelines.data?.[0];
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await convert.mutateAsync({
      id: leadId,
      body: {
        create_contact: createContact,
        create_organization: createOrganization,
        ...(createDeal
          ? {
              deal: {
                ...deal,
                pipeline_id: Number(deal.pipeline_id || selectedPipeline?.id),
                stage_id: Number(
                  deal.stage_id || selectedPipeline?.stages[0]?.id,
                ),
                value: Number(deal.value),
              },
            }
          : {}),
      },
    });
    onComplete?.();
    onClose();
  };
  return (
    <Dialog
      description="Convierte este lead en registros operativos sin duplicar información."
      onClose={onClose}
      open={open}
      title="Convertir lead"
    >
      <form className="space-y-5" onSubmit={(event) => void submit(event)}>
        <div className="border-border bg-surface-subtle space-y-3 rounded-xl border p-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={createContact}
              className="text-brand h-4 w-4"
              onChange={(event) => setCreateContact(event.target.checked)}
              type="checkbox"
            />
            Crear contacto
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={createOrganization}
              className="text-brand h-4 w-4"
              onChange={(event) => setCreateOrganization(event.target.checked)}
              type="checkbox"
            />
            Crear organización
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={createDeal}
              className="text-brand h-4 w-4"
              onChange={(event) => setCreateDeal(event.target.checked)}
              type="checkbox"
            />
            Crear oportunidad
          </label>
        </div>
        {createDeal ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="deal-name">Nombre de la oportunidad</Label>
              <Input
                id="deal-name"
                required
                value={deal.name}
                onChange={(event) =>
                  setDeal((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <FieldError message={!deal.name ? "" : undefined} />
            </div>
            <div>
              <Label htmlFor="deal-pipeline">Pipeline</Label>
              <Select
                id="deal-pipeline"
                value={deal.pipeline_id || String(selectedPipeline?.id ?? "")}
                onChange={(event) =>
                  setDeal((current) => ({
                    ...current,
                    pipeline_id: event.target.value,
                    stage_id: "",
                  }))
                }
              >
                <option value="">Selecciona</option>
                {pipelines.data?.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="deal-stage">Etapa</Label>
              <Select
                id="deal-stage"
                value={
                  deal.stage_id || String(selectedPipeline?.stages[0]?.id ?? "")
                }
                onChange={(event) =>
                  setDeal((current) => ({
                    ...current,
                    stage_id: event.target.value,
                  }))
                }
              >
                <option value="">Selecciona</option>
                {selectedPipeline?.stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="deal-value">Valor</Label>
              <Input
                id="deal-value"
                min={0}
                step="0.01"
                type="number"
                value={deal.value}
                onChange={(event) =>
                  setDeal((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="deal-currency">Moneda</Label>
              <Input
                id="deal-currency"
                maxLength={3}
                value={deal.currency}
                onChange={(event) =>
                  setDeal((current) => ({
                    ...current,
                    currency: event.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={convert.isPending} type="submit">
            {convert.isPending ? "Convirtiendo…" : "Convertir lead"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
