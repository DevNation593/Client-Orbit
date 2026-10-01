"use client";

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { Link2, MoreHorizontal, Plus } from "lucide-react";
import {
  useContacts,
  useCreateRelation,
  useDeals,
  useDeleteRelation,
  useEntityDefinitions,
  useEntityRecords,
  useLeads,
  useOrganizations,
  useRelations,
} from "@/hooks/use-crm";
import { ApiError } from "@/lib/api/error";
import { titleCase } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState, EmptyState } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Can } from "@/components/common/can";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  Contact,
  Deal,
  EntityDefinition,
  EntityRecord,
  Lead,
  Organization,
  Relation,
} from "@/types/domain";

type RelationEndpointType =
  "contact" | "organization" | "lead" | "deal" | "entity_record";

interface RelationForm {
  relation_type: string;
  from_type: RelationEndpointType;
  from_id: string;
  from_entity_id: string;
  to_type: RelationEndpointType;
  to_id: string;
  to_entity_id: string;
}

interface RecordOption {
  id: number;
  label: string;
}

const initialForm: RelationForm = {
  relation_type: "related",
  from_type: "contact",
  from_id: "",
  from_entity_id: "",
  to_type: "organization",
  to_id: "",
  to_entity_id: "",
};

export default function RelationsPage() {
  const [open, setOpen] = useState(false);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [form, setForm] = useState<RelationForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const relations = useRelations({ page: 1, per_page: 50 });
  const contacts = useContacts({ page: 1, per_page: 100 });
  const organizations = useOrganizations({ page: 1, per_page: 100 });
  const leads = useLeads({ page: 1, per_page: 100 });
  const deals = useDeals({ page: 1, per_page: 100 });
  const entities = useEntityDefinitions();
  const fromRecords = useEntityRecords(Number(form.from_entity_id) || 0, {
    page: 1,
    per_page: 100,
  });
  const toRecords = useEntityRecords(Number(form.to_entity_id) || 0, {
    page: 1,
    per_page: 100,
  });
  const create = useCreateRelation();
  const remove = useDeleteRelation();

  const standardOptions = {
    contact: contactOptions(contacts.data?.items ?? []),
    organization: organizationOptions(organizations.data?.items ?? []),
    lead: leadOptions(leads.data?.items ?? []),
    deal: dealOptions(deals.data?.items ?? []),
  };

  const columns: DataTableColumn<Relation>[] = [
    {
      key: "type",
      header: "Relación",
      render: (relation) => (
        <div className="flex items-center gap-2">
          <span className="bg-brand-soft text-brand flex h-8 w-8 items-center justify-center rounded-lg">
            <Link2 size={15} />
          </span>
          <span className="font-bold">{titleCase(relation.relation_type)}</span>
        </div>
      ),
    },
    {
      key: "from",
      header: "Desde",
      render: (relation) => (
        <span>
          {titleCase(relation.from_type)}{" "}
          <strong className="text-brand">#{relation.from_id}</strong>
        </span>
      ),
    },
    {
      key: "to",
      header: "Hacia",
      render: (relation) => (
        <span>
          {titleCase(relation.to_type)}{" "}
          <strong className="text-brand">#{relation.to_id}</strong>
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-14",
      render: (relation) => (
        <Can permission="relations.manage">
          <Button
            aria-label="Eliminar relación"
            size="icon"
            variant="ghost"
            onClick={() => {
              setRemoveError(null);
              setRemoveId(relation.id);
            }}
          >
            <MoreHorizontal size={17} />
          </Button>
        </Can>
      ),
    },
  ];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const relationType = form.relation_type
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    if (!relationType || !form.from_id || !form.to_id) {
      setFormError(
        "Selecciona los dos registros y escribe el tipo de relación.",
      );
      return;
    }

    try {
      await create.mutateAsync({
        relation_type: relationType,
        from_type: form.from_type,
        from_id: form.from_id,
        to_type: form.to_type,
        to_id: form.to_id,
        metadata: {
          ...(form.from_type === "entity_record"
            ? { from_entity_definition_id: Number(form.from_entity_id) }
            : {}),
          ...(form.to_type === "entity_record"
            ? { to_entity_definition_id: Number(form.to_entity_id) }
            : {}),
        },
      });
      setForm(initialForm);
      setOpen(false);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "No se pudo crear la relación.",
      );
    }
  };

  const selectedFromOptions =
    form.from_type === "entity_record"
      ? (fromRecords.data?.items ?? []).map((record) => ({
          id: record.id,
          label: entityRecordLabel(record),
        }))
      : standardOptions[form.from_type];
  const selectedToOptions =
    form.to_type === "entity_record"
      ? (toRecords.data?.items ?? []).map((record) => ({
          id: record.id,
          label: entityRecordLabel(record),
        }))
      : standardOptions[form.to_type];

  return (
    <>
      <PageHeader
        eyebrow="Modelo conectado"
        title="Relaciones"
        description="Conecta registros de módulos estándar y entidades personalizadas sin acoplar la interfaz a una industria."
        action={
          <Can permission="relations.manage">
            <Button
              onClick={() => {
                setFormError(null);
                setOpen(true);
              }}
            >
              <Plus size={16} />
              Nueva relación
            </Button>
          </Can>
        }
      />
      {removeError ? (
        <p className="text-danger mb-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
          {removeError}
        </p>
      ) : null}
      {relations.isError ? (
        <ErrorState onRetry={() => void relations.refetch()} />
      ) : relations.isLoading ? (
        <DataTable
          preferenceKey="relations"
          columns={columns}
          emptyTitle="Cargando relaciones"
          getRowKey={(relation) => relation.id}
          loading
          rows={[]}
        />
      ) : relations.data?.items.length ? (
        <DataTable
          preferenceKey="relations"
          columns={columns}
          emptyTitle="No hay relaciones"
          getRowKey={(relation) => relation.id}
          loading={relations.isLoading}
          rows={relations.data.items}
        />
      ) : (
        <EmptyState
          action={
            <Can permission="relations.manage">
              <Button onClick={() => setOpen(true)}>
                <Plus size={16} />
                Crear relación
              </Button>
            </Can>
          }
          description="Las relaciones aparecerán aquí cuando conectes registros."
          title="No hay relaciones"
        />
      )}
      <ConfirmDialog
        description="Se eliminará la relación entre los registros. Los registros originales no serán eliminados."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void remove
            .mutateAsync(removeId)
            .then(() => setRemoveId(null))
            .catch((error: unknown) => {
              setRemoveError(
                error instanceof ApiError
                  ? error.message
                  : "No se pudo eliminar la relación.",
              );
            });
        }}
        open={removeId !== null}
        title="Eliminar relación"
      />
      <Dialog
        description="Selecciona registros existentes de cualquier módulo del tenant."
        onClose={() => setOpen(false)}
        open={open}
        title="Crear relación"
      >
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div>
            <Label htmlFor="relation-type">Tipo de relación</Label>
            <Input
              id="relation-type"
              pattern="[a-zA-Z][a-zA-Z0-9_. -]{1,79}"
              placeholder="related, partner, decision_maker…"
              required
              value={form.relation_type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  relation_type: event.target.value,
                }))
              }
            />
          </div>
          <EndpointFields
            customRecords={fromRecords.data?.items ?? []}
            entityDefinitions={entities.data ?? []}
            options={selectedFromOptions}
            setForm={setForm}
            side="from"
            type={form.from_type}
            entityId={form.from_entity_id}
            recordId={form.from_id}
          />
          <EndpointFields
            customRecords={toRecords.data?.items ?? []}
            entityDefinitions={entities.data ?? []}
            options={selectedToOptions}
            setForm={setForm}
            side="to"
            type={form.to_type}
            entityId={form.to_entity_id}
            recordId={form.to_id}
          />
          {formError ? (
            <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={create.isPending} type="submit">
              {create.isPending ? "Guardando…" : "Guardar relación"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function EndpointFields({
  customRecords,
  entityDefinitions,
  options,
  setForm,
  side,
  type,
  entityId,
  recordId,
}: {
  customRecords: EntityRecord[];
  entityDefinitions: EntityDefinition[];
  options: RecordOption[];
  setForm: Dispatch<SetStateAction<RelationForm>>;
  side: "from" | "to";
  type: RelationEndpointType;
  entityId: string;
  recordId: string;
}) {
  const typeId = side + "-type";
  const entityIdInput = side + "-entity";
  const recordIdInput = side + "-id";
  const label = side === "from" ? "Desde" : "Hacia";
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3">
      <p className="text-sm font-bold">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={typeId}>Tipo</Label>
          <Select
            id={typeId}
            value={type}
            onChange={(event) => {
              const nextType = event.target.value as RelationEndpointType;
              setForm((current) =>
                side === "from"
                  ? {
                      ...current,
                      from_type: nextType,
                      from_id: "",
                      from_entity_id: "",
                    }
                  : {
                      ...current,
                      to_type: nextType,
                      to_id: "",
                      to_entity_id: "",
                    },
              );
            }}
          >
            <option value="contact">Contacto</option>
            <option value="organization">Organización</option>
            <option value="lead">Lead</option>
            <option value="deal">Oportunidad</option>
            <option value="entity_record">Entidad personalizada</option>
          </Select>
        </div>
        {type === "entity_record" ? (
          <div>
            <Label htmlFor={entityIdInput}>Entidad</Label>
            <Select
              id={entityIdInput}
              required
              value={entityId}
              onChange={(event) =>
                setForm((current) =>
                  side === "from"
                    ? {
                        ...current,
                        from_entity_id: event.target.value,
                        from_id: "",
                      }
                    : {
                        ...current,
                        to_entity_id: event.target.value,
                        to_id: "",
                      },
                )
              }
            >
              <option value="">Selecciona una entidad</option>
              {entityDefinitions.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>
      <div>
        <Label htmlFor={recordIdInput}>Registro</Label>
        <Select
          disabled={type === "entity_record" && !entityId}
          id={recordIdInput}
          required
          value={recordId}
          onChange={(event) =>
            setForm((current) =>
              side === "from"
                ? { ...current, from_id: event.target.value }
                : { ...current, to_id: event.target.value },
            )
          }
        >
          <option value="">Selecciona un registro</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
        {type === "entity_record" && entityId && !customRecords.length ? (
          <p className="text-muted mt-1.5 text-xs">
            No hay registros en esta entidad.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function contactOptions(items: Contact[]): RecordOption[] {
  return items.map((contact) => ({
    id: contact.id,
    label:
      [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
      contact.email ||
      "Contacto #" + contact.id,
  }));
}

function organizationOptions(items: Organization[]): RecordOption[] {
  return items.map((organization) => ({
    id: organization.id,
    label: organization.name,
  }));
}

function leadOptions(items: Lead[]): RecordOption[] {
  return items.map((lead) => ({
    id: lead.id,
    label:
      [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
      lead.email ||
      "Lead #" + lead.id,
  }));
}

function dealOptions(items: Deal[]): RecordOption[] {
  return items.map((deal) => ({ id: deal.id, label: deal.name }));
}

function entityRecordLabel(record: EntityRecord): string {
  const preferred = [record.data.name, record.data.title, record.data.label];
  const value = preferred.find(
    (entry): entry is string | number =>
      typeof entry === "string" || typeof entry === "number",
  );
  if (value !== undefined) return String(value);
  const firstScalar = Object.values(record.data).find(
    (entry): entry is string | number =>
      typeof entry === "string" || typeof entry === "number",
  );
  return firstScalar !== undefined
    ? String(firstScalar)
    : "Registro #" + record.id;
}
