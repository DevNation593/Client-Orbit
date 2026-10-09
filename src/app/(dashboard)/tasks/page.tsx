"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useDeleteTask, useTasks, useUpdateTask } from "@/hooks/use-crm";
import { formatRelativeDate } from "@/lib/utils";
import type { Task } from "@/types/domain";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Can } from "@/components/common/can";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { ListToolbar } from "@/components/tables/list-toolbar";
import { SavedViewsMenu } from "@/features/saved-views/saved-views-menu";
import { useListView } from "@/features/saved-views/use-list-view";
import { Pagination } from "@/components/tables/pagination";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";

// Column key to the field `GET /tasks` accepts in `sort`.
const SORT_FIELDS = {
  title: "title",
  priority: "priority",
  status: "status",
  due_at: "due_at",
};

export default function TasksPage() {
  const router = useRouter();
  const [search, setSearch] = usePersistedState("tasks.search", "");
  const [removeId, setRemoveId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const columns: DataTableColumn<Task>[] = [
    {
      key: "title",
      header: "Tarea",
      sortable: true,
      render: (task) => (
        <div className="flex items-center gap-3">
          <button
            aria-label={`Marcar ${task.title} como completada`}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${task.status === "completed" ? "border-success text-success bg-emerald-50" : "border-border hover:border-brand text-transparent"}`}
            onClick={(event) => {
              event.stopPropagation();
              void update.mutateAsync({
                id: task.id,
                body: {
                  status: task.status === "completed" ? "pending" : "completed",
                },
              });
            }}
            type="button"
          >
            <Check size={15} />
          </button>
          <div>
            <Link
              className="hover:text-brand font-bold"
              href={`/tasks/${task.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              {task.title}
            </Link>
            <p className="text-muted mt-0.5 max-w-[330px] truncate text-xs">
              {task.description ?? "Sin descripción"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Prioridad",
      sortable: true,
      render: (task) => <StatusBadge value={task.priority} />,
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (task) => <StatusBadge value={task.status} />,
    },
    {
      key: "assignee",
      header: "Asignada a",
      render: (task) =>
        task.assignee?.name ?? <span className="text-muted">Sin asignar</span>,
    },
    {
      key: "due_at",
      header: "Vencimiento",
      sortable: true,
      render: (task) => (
        <span
          className={
            task.status !== "completed" &&
            task.due_at &&
            new Date(task.due_at) < new Date()
              ? "text-danger font-semibold"
              : "text-muted"
          }
        >
          {formatRelativeDate(task.due_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (task) => (
        <Button
          aria-label={`Acciones para ${task.title}`}
          size="icon"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            setRemoveId(task.id);
          }}
        >
          <MoreHorizontal size={17} />
        </Button>
      ),
    },
  ];
  const list = useListView("tasks", {
    columns: columns.map((column) => column.key),
    sortFields: SORT_FIELDS,
  });
  const { setPage } = list;
  const statusValue = list.filterValue("status");
  const status = typeof statusValue === "string" ? statusValue : "";
  const tasks = useTasks({
    page: list.page,
    per_page: 10,
    search: debouncedSearch,
    ...list.query,
  });
  return (
    <>
      <PageHeader
        eyebrow="Productividad"
        title="Tareas"
        description="Organiza seguimientos, vencimientos y responsabilidades de tu equipo."
        action={
          <Can permission="tasks.create">
            <Link
              className="bg-brand hover:bg-brand-strong inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm"
              href="/tasks/new"
            >
              Nueva tarea
            </Link>
          </Can>
        }
      />
      <ListToolbar
        actionLabel="Nueva tarea"
        onAction={() => router.push("/tasks/new")}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        search={search}
        placeholder="Buscar tareas…"
        activeFilters={list.filters.length}
        onClearFilters={list.clearFilters}
      >
        <SavedViewsMenu entityType="tasks" {...list.views} />
        <select
          aria-label="Filtrar por estado"
          className="border-border text-muted h-9 rounded-lg border bg-white px-2.5 text-xs font-semibold"
          value={status}
          onChange={(event) => list.setFilter("status", event.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completadas</option>
        </select>
      </ListToolbar>
      {tasks.isError ? (
        <ErrorState onRetry={() => void tasks.refetch()} />
      ) : (
        <>
          <DataTable
            {...list.sorting}
            columnVisibility={list.columnVisibility}
            onColumnVisibilityChange={list.setColumnVisibility}
            columns={columns}
            emptyDescription="Crea una tarea para organizar el siguiente paso."
            emptyTitle="No hay tareas"
            getRowKey={(task) => task.id}
            loading={tasks.isLoading}
            onRowClick={(task) => router.push(`/tasks/${task.id}`)}
            rows={tasks.data?.items ?? []}
          />
          <Pagination meta={tasks.data?.meta} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog
        description="Se eliminará la tarea y su historial. No se puede deshacer."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove.mutateAsync(removeId).then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar tarea"
      />
    </>
  );
}
