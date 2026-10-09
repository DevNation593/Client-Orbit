"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Phone } from "lucide-react";
import { useState } from "react";
import { useContacts, useDeleteContact } from "@/hooks/use-crm";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { formatDate } from "@/lib/utils";
import type { Contact } from "@/types/domain";
import { PageHeader } from "@/components/common/page-header";
import { Avatar } from "@/components/common/avatar";
import { ErrorState } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Can } from "@/components/common/can";
import { StatusBadge } from "@/components/common/status-badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { ListToolbar } from "@/components/tables/list-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { SavedViewsMenu } from "@/features/saved-views/saved-views-menu";
import { useListView } from "@/features/saved-views/use-list-view";
import { Button } from "@/components/ui/button";

// Column key to the field `GET /contacts` accepts in `sort`.
const SORT_FIELDS = { name: "first_name", created_at: "created_at" };

export default function ContactsPage() {
  const router = useRouter();
  const [search, setSearch] = usePersistedState("contacts.search", "");
  const [removeId, setRemoveId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const remove = useDeleteContact();
  const columns: DataTableColumn<Contact>[] = [
    {
      key: "name",
      header: "Contacto",
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={`${contact.first_name} ${contact.last_name ?? ""}`}
            size="sm"
          />
          <div className="min-w-0">
            <Link
              className="hover:text-brand block truncate font-bold"
              href={`/contacts/${contact.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              {contact.first_name} {contact.last_name}
            </Link>
            <span className="text-muted block truncate text-xs">
              {contact.email ?? "Sin correo"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      render: (contact) =>
        contact.phone ? (
          <span className="text-muted inline-flex items-center gap-1.5">
            <Phone size={14} />
            {contact.phone}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "organizations",
      header: "Organización",
      render: (contact) =>
        contact.organizations?.[0]?.name ?? (
          <span className="text-muted">Sin asignar</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      render: (contact) => <StatusBadge value={contact.status} />,
    },
    {
      key: "created_at",
      header: "Creado",
      sortable: true,
      render: (contact) => (
        <span className="text-muted">{formatDate(contact.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (contact) => (
        <Button
          aria-label={`Acciones para ${contact.first_name}`}
          size="icon"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            setRemoveId(contact.id);
          }}
        >
          <MoreHorizontal size={17} />
        </Button>
      ),
    },
  ];
  const list = useListView("contacts", {
    columns: columns.map((column) => column.key),
    sortFields: SORT_FIELDS,
  });
  const { setPage } = list;
  const statusValue = list.filterValue("status");
  const status = typeof statusValue === "string" ? statusValue : "";
  const contacts = useContacts({
    page: list.page,
    per_page: 10,
    search: debouncedSearch,
    ...list.query,
  });
  return (
    <>
      <PageHeader
        eyebrow="Relaciones"
        title="Contactos"
        description="Centraliza personas, actividad y relaciones de tu organización."
        action={
          <Can permission="contacts.create">
            <Link
              className="bg-brand hover:bg-brand-strong inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm"
              href="/contacts/new"
            >
              Nuevo contacto
            </Link>
          </Can>
        }
      />
      <ListToolbar
        actionLabel="Nuevo contacto"
        onAction={() => router.push("/contacts/new")}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        search={search}
        placeholder="Buscar por nombre, correo o teléfono…"
        activeFilters={list.filters.length}
        onClearFilters={list.clearFilters}
      >
        <SavedViewsMenu entityType="contacts" {...list.views} />
        <select
          aria-label="Filtrar por estado"
          className="border-border text-muted h-9 rounded-lg border bg-white px-2.5 text-xs font-semibold"
          value={status}
          onChange={(event) => list.setFilter("status", event.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="prospect">Prospectos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </ListToolbar>
      {contacts.isError ? (
        <ErrorState onRetry={() => void contacts.refetch()} />
      ) : (
        <>
          <DataTable
            {...list.sorting}
            columnVisibility={list.columnVisibility}
            onColumnVisibilityChange={list.setColumnVisibility}
            columns={columns}
            emptyDescription="Crea el primer contacto o ajusta tu búsqueda para ver resultados."
            emptyTitle="No hay contactos"
            getRowKey={(contact) => contact.id}
            loading={contacts.isLoading}
            onRowClick={(contact) => router.push(`/contacts/${contact.id}`)}
            rows={contacts.data?.items ?? []}
          />
          <Pagination meta={contacts.data?.meta} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog
        description="Esta acción eliminará el contacto y sus relaciones desde este espacio. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove.mutateAsync(removeId).then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar contacto"
      />
    </>
  );
}
