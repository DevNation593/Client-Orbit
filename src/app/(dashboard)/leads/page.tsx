"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Star } from "lucide-react";
import { useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useDeleteLead, useLeads } from "@/hooks/use-crm";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { Avatar } from "@/components/common/avatar";
import { ErrorState } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Can } from "@/components/common/can";
import { ConvertLeadDialog } from "@/features/leads/components/convert-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { ListToolbar } from "@/components/tables/list-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";

export default function LeadsPage() {
  const router = useRouter();
  const [search, setSearch] = usePersistedState("leads.search", "");
  const [page, setPage] = useState(1);
  const [convertId, setConvertId] = useState<number | null>(null);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const leads = useLeads({
    page,
    per_page: 10,
    search: useDebouncedValue(search),
  });
  const remove = useDeleteLead();
  const columns: DataTableColumn<
    NonNullable<typeof leads.data>["items"][number]
  >[] = [
    {
      key: "name",
      header: "Lead",
      render: (lead) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={`${lead.first_name ?? ""} ${lead.last_name ?? ""}`}
            size="sm"
          />
          <div className="min-w-0">
            <Link
              className="hover:text-brand block truncate font-bold"
              href={`/leads/${lead.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              {lead.first_name || lead.last_name
                ? `${lead.first_name ?? ""} ${lead.last_name ?? ""}`
                : "Lead sin nombre"}
            </Link>
            <span className="text-muted block truncate text-xs">
              {lead.email ?? "Sin correo"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Origen",
      render: (lead) =>
        lead.source ?? <span className="text-muted">No definido</span>,
    },
    {
      key: "score",
      header: "Score",
      sortable: true,
      render: (lead) => (
        <span className="inline-flex items-center gap-1 font-bold">
          <Star className="text-amber-500" fill="currentColor" size={14} />
          {lead.score ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (lead) => <StatusBadge value={lead.status} />,
    },
    {
      key: "created_at",
      header: "Creado",
      render: (lead) => (
        <span className="text-muted">{formatDate(lead.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      render: (lead) => (
        <div className="flex items-center justify-end gap-1">
          <Can permission="leads.convert">
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                setConvertId(lead.id);
              }}
            >
              Convertir
            </Button>
          </Can>
          <Button
            aria-label={`Acciones para lead ${lead.id}`}
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setRemoveId(lead.id);
            }}
          >
            <MoreHorizontal size={17} />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Captación"
        title="Leads"
        description="Califica, trabaja y convierte oportunidades potenciales desde un solo lugar."
        action={
          <Can permission="leads.create">
            <Link
              className="bg-brand hover:bg-brand-strong inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm"
              href="/leads/new"
            >
              Nuevo lead
            </Link>
          </Can>
        }
      />
      <ListToolbar
        actionLabel="Nuevo lead"
        onAction={() => router.push("/leads/new")}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        search={search}
        placeholder="Buscar por nombre, correo u origen…"
      />
      {leads.isError ? (
        <ErrorState onRetry={() => void leads.refetch()} />
      ) : (
        <>
          <DataTable
            preferenceKey="leads"
            columns={columns}
            emptyDescription="Añade un lead para empezar a trabajar tu embudo."
            emptyTitle="No hay leads"
            getRowKey={(lead) => lead.id}
            loading={leads.isLoading}
            onRowClick={(lead) => router.push(`/leads/${lead.id}`)}
            rows={leads.data?.items ?? []}
          />
          <Pagination meta={leads.data?.meta} onPageChange={setPage} />
        </>
      )}
      <ConvertLeadDialog
        leadId={convertId ?? 0}
        onClose={() => setConvertId(null)}
        onComplete={() => void leads.refetch()}
        open={convertId !== null}
      />
      <ConfirmDialog
        description="Se eliminará el lead y no podrá recuperarse desde este espacio."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove.mutateAsync(removeId).then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar lead"
      />
    </>
  );
}
