"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersistedState } from "@/hooks/use-persisted-state";
import {
  useDeleteEntityRecord,
  useEntityDefinition,
  useEntityRecords,
} from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/async-state";
import { Can } from "@/components/common/can";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { ListToolbar } from "@/components/tables/list-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { Button } from "@/components/ui/button";
import type { EntityRecord } from "@/types/domain";

export default function EntityRecordsPage() {
  const { entityId: entityIdParam } = useParams<{ entityId: string }>();
  const entityId = Number(entityIdParam);
  const router = useRouter();
  const [search, setSearch] = usePersistedState(
    "entity-" + entityId + ".search",
    "",
  );
  const [page, setPage] = useState(1);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const definition = useEntityDefinition(entityId);
  const records = useEntityRecords(entityId, {
    page,
    per_page: 10,
    search: useDebouncedValue(search),
  });
  const remove = useDeleteEntityRecord();
  if (definition.isLoading)
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;
  if (definition.isError || !definition.data)
    return (
      <ErrorState
        title="Entidad no encontrada"
        description="La entidad puede estar inactiva o no pertenecer a tu organización."
        onRetry={() => void definition.refetch()}
      />
    );
  const fields = definition.data.fields ?? [];
  const columns: DataTableColumn<EntityRecord>[] = [
    {
      key: "id",
      header: "ID",
      render: (record) => (
        <Link
          className="text-brand font-bold"
          href={`/entities/${entityId}/${record.id}`}
        >
          #{record.id}
        </Link>
      ),
    },
    ...fields.slice(0, 5).map((field) => ({
      key: field.name,
      header: field.label,
      render: (record: EntityRecord) => (
        <span className="line-clamp-1">
          {formatValue(record.data[field.name])}
        </span>
      ),
    })),
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (record) => (
        <Button
          aria-label={`Eliminar registro ${record.id}`}
          size="sm"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            setRemoveId(record.id);
          }}
        >
          Eliminar
        </Button>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Entidades dinámicas"
        title={definition.data.label}
        description={`Registros de ${definition.data.label.toLowerCase()} configurados por tu organización.`}
        action={
          <div className="flex gap-2">
            <Link
              className="border-border hover:bg-surface-subtle inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold"
              href={`/settings/entities/${definition.data.id}`}
            >
              <Settings2 size={16} />
              Configurar
            </Link>
            <Can permission="custom_entities.manage">
              <Link
                className="bg-brand hover:bg-brand-strong inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white"
                href={`/entities/${entityId}/new`}
              >
                <Plus size={16} />
                Nuevo registro
              </Link>
            </Can>
          </div>
        }
      />
      <ListToolbar
        search={search}
        actionLabel="Nuevo registro"
        onAction={() => router.push(`/entities/${entityId}/new`)}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder={`Buscar ${definition.data.label.toLowerCase()}…`}
      />
      {records.isError ? (
        <ErrorState onRetry={() => void records.refetch()} />
      ) : (
        <>
          <DataTable
            preferenceKey={"entity-" + entityId}
            columns={columns}
            emptyDescription="Crea el primer registro para esta entidad dinámica."
            emptyTitle={`No hay ${definition.data.label.toLowerCase()}`}
            getRowKey={(record) => record.id}
            loading={records.isLoading}
            onRowClick={(record) =>
              router.push(`/entities/${entityId}/${record.id}`)
            }
            rows={records.data?.items ?? []}
          />
          <Pagination meta={records.data?.meta} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog
        description="Se eliminará este registro de la entidad dinámica. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove
              .mutateAsync({ entityDefinitionId: entityId, id: removeId })
              .then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar registro"
      />
    </>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
