"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import {
  useCreateField,
  useDeleteField,
  useEntityDefinitions,
  useFieldDefinitions,
} from "@/hooks/use-crm";
import { titleCase } from "@/lib/utils";
import type { CustomFieldType, FieldDefinition } from "@/types/domain";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const fieldTypes: CustomFieldType[] = [
  "text",
  "textarea",
  "number",
  "decimal",
  "currency",
  "email",
  "phone",
  "url",
  "date",
  "datetime",
  "boolean",
  "select",
  "multi_select",
  "user",
  "relation",
  "file",
];

const builtInEntities = [
  "contacts",
  "organizations",
  "leads",
  "deals",
  "tasks",
  "activities",
] as const;

type BuiltInEntityType = (typeof builtInEntities)[number];
type FieldTarget =
  | { kind: "builtin"; entityType: BuiltInEntityType }
  | { kind: "custom"; entityDefinitionId: number };

export default function CustomFieldsPage() {
  const searchParams = useSearchParams();
  const requestedDefinitionId = Number(
    searchParams.get("entity_definition_id"),
  );
  const [open, setOpen] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [target, setTarget] = useState<FieldTarget>(() =>
    Number.isInteger(requestedDefinitionId) && requestedDefinitionId > 0
      ? { kind: "custom", entityDefinitionId: requestedDefinitionId }
      : { kind: "builtin", entityType: "contacts" },
  );
  const [form, setForm] = useState({
    name: "",
    label: "",
    type: "text" as CustomFieldType,
    required: false,
    options: "",
  });
  const fields = useFieldDefinitions();
  const entities = useEntityDefinitions();
  const create = useCreateField();
  const remove = useDeleteField();
  const targetValue =
    target.kind === "builtin"
      ? `builtin:${target.entityType}`
      : `custom:${target.entityDefinitionId}`;
  const columns: DataTableColumn<FieldDefinition>[] = [
    {
      key: "label",
      header: "Campo",
      render: (field) => (
        <div>
          <p className="font-bold">{field.label}</p>
          <p className="text-muted mt-0.5 text-xs">{field.name}</p>
        </div>
      ),
    },
    {
      key: "entity",
      header: "Entidad",
      render: (field) => {
        const customEntity = field.entity_definition_id
          ? entities.data?.find(
              (entity) => entity.id === field.entity_definition_id,
            )
          : undefined;
        const label = customEntity?.label
          ? customEntity.label
          : field.entity_type
            ? titleCase(field.entity_type)
            : field.entity_definition_id
              ? `Entidad #${field.entity_definition_id}`
              : "Sin entidad";
        return <span className="font-semibold">{label}</span>;
      },
    },
    {
      key: "type",
      header: "Tipo",
      render: (field) => (
        <span className="bg-brand-soft text-brand-strong rounded-lg px-2 py-1 text-xs font-semibold">
          {titleCase(field.type)}
        </span>
      ),
    },
    {
      key: "required",
      header: "Requerido",
      render: (field) =>
        field.required ? (
          <span className="text-success">Sí</span>
        ) : (
          <span className="text-muted">No</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-14",
      render: (field) => (
        <Button
          aria-label={`Eliminar ${field.label}`}
          size="icon"
          variant="ghost"
          onClick={() => setRemoveId(field.id)}
        >
          <MoreHorizontal size={17} />
        </Button>
      ),
    },
  ];
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetPayload =
      target.kind === "builtin"
        ? { entity_type: target.entityType }
        : { entity_definition_id: target.entityDefinitionId };
    await create.mutateAsync({
      ...targetPayload,
      name: form.name,
      label: form.label,
      type: form.type,
      required: form.required,
      options: ["select", "multi_select"].includes(form.type)
        ? form.options
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean)
        : undefined,
    });
    setOpen(false);
    setTarget({ kind: "builtin", entityType: "contacts" });
    setForm({
      name: "",
      label: "",
      type: "text",
      required: false,
      options: "",
    });
  };
  return (
    <>
      <PageHeader
        eyebrow="Diseño flexible"
        title="Campos personalizados"
        description="Define la información que cada entidad necesita y úsala en formularios dinámicos."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Nuevo campo
          </Button>
        }
      />
      {fields.isError ? (
        <ErrorState onRetry={() => void fields.refetch()} />
      ) : (
        <DataTable
          preferenceKey="field-definitions"
          columns={columns}
          emptyDescription="Crea campos para adaptar los módulos a tu proceso."
          emptyTitle="No hay campos personalizados"
          getRowKey={(field) => field.id}
          loading={fields.isLoading}
          rows={fields.data ?? []}
        />
      )}
      <ConfirmDialog
        description="Se eliminará la definición del campo. Los valores existentes podrían dejar de mostrarse."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove.mutateAsync(removeId).then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar campo"
      />
      <Dialog
        description="Los campos se renderizarán automáticamente en formularios y detalles."
        onClose={() => setOpen(false)}
        open={open}
        title="Crear campo personalizado"
      >
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div>
            <Label htmlFor="field-entity">Entidad</Label>
            <Select
              id="field-entity"
              value={targetValue}
              onChange={(event) => {
                const [kind, rawValue] = event.target.value.split(":");
                if (kind === "custom") {
                  const entityDefinitionId = Number(rawValue);
                  if (Number.isInteger(entityDefinitionId))
                    setTarget({ kind: "custom", entityDefinitionId });
                  return;
                }
                if (
                  rawValue &&
                  (builtInEntities as readonly string[]).includes(rawValue)
                ) {
                  setTarget({
                    kind: "builtin",
                    entityType: rawValue as BuiltInEntityType,
                  });
                }
              }}
            >
              <optgroup label="Módulos estándar">
                {builtInEntities.map((entityType) => (
                  <option key={entityType} value={`builtin:${entityType}`}>
                    {titleCase(entityType)}
                  </option>
                ))}
              </optgroup>
              {entities.data?.length ? (
                <optgroup label="Entidades personalizadas">
                  {entities.data.map((entity) => (
                    <option key={entity.id} value={`custom:${entity.id}`}>
                      {entity.label}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="field-name">Nombre interno</Label>
              <Input
                id="field-name"
                pattern="[a-z][a-z0-9_]*"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "_"),
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="field-label">Etiqueta</Label>
              <Input
                id="field-label"
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
          </div>
          <div>
            <Label htmlFor="field-type">Tipo</Label>
            <Select
              id="field-type"
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as CustomFieldType,
                }))
              }
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </Select>
          </div>
          {["select", "multi_select"].includes(form.type) ? (
            <div>
              <Label htmlFor="field-options">
                Opciones{" "}
                <span className="text-muted font-normal">(una por línea)</span>
              </Label>
              <Textarea
                id="field-options"
                required
                value={form.options}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    options: event.target.value,
                  }))
                }
              />
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={form.required}
              className="text-brand h-4 w-4"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  required: event.target.checked,
                }))
              }
              type="checkbox"
            />
            Campo obligatorio
          </label>
          {create.isError ? (
            <p className="text-danger rounded-xl bg-rose-50 p-3 text-sm">
              No se pudo crear el campo. Revisa el tipo y la entidad.
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={create.isPending} type="submit">
              {create.isPending ? "Creando…" : "Crear campo"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
