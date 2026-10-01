"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useDeleteOrganization, useOrganizations } from "@/hooks/use-crm";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/async-state";
import { Can } from "@/components/common/can";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { ListToolbar } from "@/components/tables/list-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { Button } from "@/components/ui/button";

export default function OrganizationsPage() {
  const router = useRouter();
  const [search, setSearch] = usePersistedState("organizations.search", "");
  const [page, setPage] = useState(1);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const organizations = useOrganizations({
    page,
    per_page: 10,
    search: useDebouncedValue(search),
  });
  const remove = useDeleteOrganization();
  const columns: DataTableColumn<
    NonNullable<typeof organizations.data>["items"][number]
  >[] = [
    {
      key: "name",
      header: "Organización",
      sortable: true,
      render: (organization) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 size={17} />
          </span>
          <div className="min-w-0">
            <Link
              className="hover:text-brand block truncate font-bold"
              href={`/organizations/${organization.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              {organization.name}
            </Link>
            <span className="text-muted block truncate text-xs">
              {organization.legal_name ?? "Sin razón social"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contacto",
      render: (organization) =>
        organization.email ?? <span className="text-muted">—</span>,
    },
    {
      key: "phone",
      header: "Teléfono",
      render: (organization) =>
        organization.phone ?? <span className="text-muted">—</span>,
    },
    {
      key: "contacts",
      header: "Contactos",
      render: (organization) => (
        <span className="font-semibold">
          {organization.contacts?.length ?? 0}
        </span>
      ),
    },
    {
      key: "owner",
      header: "Responsable",
      render: (organization) =>
        organization.owner?.name ?? (
          <span className="text-muted">Sin asignar</span>
        ),
    },
    {
      key: "created_at",
      header: "Creada",
      sortable: true,
      render: (organization) => (
        <span className="text-muted">
          {formatDate(organization.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (organization) => (
        <Button
          aria-label={`Acciones para ${organization.name}`}
          size="icon"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            setRemoveId(organization.id);
          }}
        >
          <MoreHorizontal size={17} />
        </Button>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Relaciones"
        title="Organizaciones"
        description="Gestiona empresas y los contactos que forman parte de cada relación."
        action={
          <Can permission="organizations.create">
            <Link
              className="bg-brand hover:bg-brand-strong inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm"
              href="/organizations/new"
            >
              Nueva organización
            </Link>
          </Can>
        }
      />
      <ListToolbar
        actionLabel="Nueva organización"
        onAction={() => router.push("/organizations/new")}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        search={search}
        placeholder="Buscar por nombre, correo o teléfono…"
      />
      {organizations.isError ? (
        <ErrorState onRetry={() => void organizations.refetch()} />
      ) : (
        <>
          <DataTable
            preferenceKey="organizations"
            columns={columns}
            emptyDescription="Crea la primera organización o ajusta tu búsqueda."
            emptyTitle="No hay organizaciones"
            getRowKey={(organization) => organization.id}
            loading={organizations.isLoading}
            onRowClick={(organization) =>
              router.push(`/organizations/${organization.id}`)
            }
            rows={organizations.data?.items ?? []}
          />
          <Pagination meta={organizations.data?.meta} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog
        description="Se eliminará la organización y se desvincularán sus relaciones. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove.mutateAsync(removeId).then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar organización"
      />
    </>
  );
}
