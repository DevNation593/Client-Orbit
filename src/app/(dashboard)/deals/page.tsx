"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useMemo } from "react";
import { useDeals, usePipelines, useUpdateDeal } from "@/hooks/use-crm";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/async-state";
import { Can } from "@/components/common/can";
import { PipelineBoard } from "@/features/deals/components/pipeline-board";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { ListToolbar } from "@/components/tables/list-toolbar";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";

export default function DealsPage() {
  const router = useRouter();
  const [pipelineId, setPipelineId] = usePersistedState<number | null>(
    "deals.pipeline",
    null,
  );
  const [view, setView] = usePersistedState<"board" | "list">(
    "deals.view",
    "board",
  );
  const [search, setSearch] = usePersistedState("deals.search", "");
  const pipelines = usePipelines();
  const deals = useDeals({ page: 1, per_page: 100, search });
  const update = useUpdateDeal();
  const selectedPipeline =
    pipelines.data?.find((pipeline) => pipeline.id === pipelineId) ??
    pipelines.data?.find((pipeline) => pipeline.is_default) ??
    pipelines.data?.[0];
  const filteredDeals = useMemo(
    () =>
      deals.data?.items.filter(
        (deal) => !selectedPipeline || deal.pipeline_id === selectedPipeline.id,
      ) ?? [],
    [deals.data?.items, selectedPipeline],
  );
  const columns: DataTableColumn<
    NonNullable<typeof deals.data>["items"][number]
  >[] = [
    {
      key: "name",
      header: "Oportunidad",
      render: (deal) => (
        <Link className="hover:text-brand font-bold" href={`/deals/${deal.id}`}>
          {deal.name}
        </Link>
      ),
    },
    {
      key: "stage",
      header: "Etapa",
      render: (deal) => (
        <StatusBadge
          value={
            deal.stage?.is_won
              ? "won"
              : deal.stage?.is_lost
                ? "lost"
                : deal.stage
                  ? "open"
                  : undefined
          }
          label={deal.stage?.name ?? "Sin etapa"}
        />
      ),
    },
    {
      key: "value",
      header: "Valor",
      sortable: true,
      render: (deal) => (
        <span className="font-bold">
          {formatCurrency(deal.value, deal.currency)}
        </span>
      ),
    },
    {
      key: "owner",
      header: "Responsable",
      render: (deal) =>
        deal.owner?.name ?? <span className="text-muted">Sin asignar</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (deal) => <StatusBadge value={deal.status} />,
    },
  ];
  const moveDeal = (
    deal: NonNullable<typeof deals.data>["items"][number],
    stageId: number,
  ) => void update.mutateAsync({ id: deal.id, body: { stage_id: stageId } });
  return (
    <>
      <PageHeader
        eyebrow="Ingresos"
        title="Oportunidades"
        description="Visualiza el pipeline, mueve negocios y mantén el pronóstico actualizado."
        action={
          <Can permission="deals.create">
            <Link
              className="bg-brand hover:bg-brand-strong inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm"
              href="/deals/new"
            >
              <Plus size={16} />
              Nueva oportunidad
            </Link>
          </Can>
        }
      />
      <ListToolbar
        actionLabel="Nueva oportunidad"
        onAction={() => router.push("/deals/new")}
        onSearch={setSearch}
        search={search}
        placeholder="Buscar oportunidades…"
        activeFilters={pipelineId ? 1 : 0}
        onClearFilters={() => setPipelineId(null)}
      >
        <select
          aria-label="Seleccionar pipeline"
          className="border-border text-muted h-9 rounded-lg border bg-white px-2.5 text-xs font-semibold"
          value={selectedPipeline?.id ?? ""}
          onChange={(event) =>
            setPipelineId(
              event.target.value ? Number(event.target.value) : null,
            )
          }
        >
          <option value="">Todos los pipelines</option>
          {pipelines.data?.map((pipeline) => (
            <option key={pipeline.id} value={pipeline.id}>
              {pipeline.name}
            </option>
          ))}
        </select>
        <div className="border-border hidden items-center rounded-lg border bg-white p-0.5 sm:flex">
          <Button
            aria-label="Vista kanban"
            className="h-8 w-8"
            size="icon"
            variant={view === "board" ? "outline" : "ghost"}
            onClick={() => setView("board")}
          >
            <LayoutGrid size={15} />
          </Button>
          <Button
            aria-label="Vista lista"
            className="h-8 w-8"
            size="icon"
            variant={view === "list" ? "outline" : "ghost"}
            onClick={() => setView("list")}
          >
            <List size={15} />
          </Button>
        </div>
      </ListToolbar>
      {pipelines.isError || deals.isError ? (
        <ErrorState
          onRetry={() => {
            void pipelines.refetch();
            void deals.refetch();
          }}
        />
      ) : selectedPipeline && view === "board" ? (
        <PipelineBoard
          deals={filteredDeals}
          onCreate={() => router.push("/deals/new")}
          onMove={moveDeal}
          pipeline={selectedPipeline}
        />
      ) : (
        <DataTable
          preferenceKey="deals"
          columns={columns}
          emptyDescription="Crea una oportunidad para empezar a visualizar tu pipeline."
          emptyTitle="No hay oportunidades"
          getRowKey={(deal) => deal.id}
          loading={pipelines.isLoading || deals.isLoading}
          onRowClick={(deal) => router.push(`/deals/${deal.id}`)}
          rows={filteredDeals}
        />
      )}
    </>
  );
}
