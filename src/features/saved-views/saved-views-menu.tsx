"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { hasPermission } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/error";
import { crmApi } from "@/lib/api/resources";
import { useAuthStore } from "@/lib/auth-store";
import {
  buildViewPayload,
  type ListSort,
  type SavedView,
  type SavedViewFilter,
  type ViewVisibility,
} from "./saved-views";

interface SavedViewsMenuProps {
  /** Entity name as the API expects it: `contacts`, `leads`, `deals`… */
  entityType: string;
  /** Current state of the list, used when saving a new view. */
  filters: SavedViewFilter[];
  sort: ListSort | null;
  columns: string[];
  columnVisibility: Record<string, boolean>;
  /** Called with the chosen view, or `null` when no view is selected. */
  onApply: (view: SavedView | null) => void;
}

const visibilityOptions: Array<[value: ViewVisibility, label: string]> = [
  ["private", "Solo yo"],
  ["team", "Mi rol"],
  ["tenant", "Toda la organización"],
];

const selectClassName =
  "border-border text-muted h-9 max-w-[200px] rounded-lg border bg-white px-2.5 text-xs font-semibold";

export function SavedViewsMenu(props: SavedViewsMenuProps) {
  const user = useAuthStore((state) => state.user);
  const can = (permission: string) =>
    !!user &&
    hasPermission(permission, user.permissions, user.is_platform_admin);
  if (!user || !can("saved_views.view")) return null;
  return (
    <ViewPicker
      {...props}
      canManage={can("saved_views.manage")}
      userId={user.id}
    />
  );
}

function ViewPicker({
  entityType,
  filters,
  sort,
  columns,
  columnVisibility,
  onApply,
  canManage,
  userId,
}: SavedViewsMenuProps & { canManage: boolean; userId: number }) {
  const queryClient = useQueryClient();
  const queryKey = ["saved-views", entityType];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<ViewVisibility>("private");
  const [error, setError] = useState<string | null>(null);

  const views = useQuery({
    queryKey,
    queryFn: () =>
      crmApi.savedViews.list({ entity_type: entityType, per_page: 50 }),
  });
  const items = views.data?.items ?? [];
  const selected = items.find((view) => view.id === selectedId) ?? null;
  const ownsSelected = selected?.user_id === userId;

  const fail = (reason: unknown) =>
    setError(
      reason instanceof ApiError
        ? (Object.values(reason.fieldErrors)[0]?.[0] ?? reason.message)
        : "No se pudo guardar la vista.",
    );
  const stopNaming = () => {
    setNaming(false);
    setName("");
    setVisibility("private");
  };
  const save = useMutation({
    mutationFn: () =>
      crmApi.savedViews.create(
        buildViewPayload({
          entityType,
          name,
          filters,
          sort,
          columns,
          columnVisibility,
          visibility,
        }),
      ),
    onSuccess: async (view) => {
      await queryClient.invalidateQueries({ queryKey });
      setSelectedId(view.id);
      stopNaming();
    },
    onError: fail,
  });
  const share = useMutation({
    mutationFn: (change: { view: SavedView; visibility: ViewVisibility }) =>
      crmApi.savedViews.update(change.view.id, {
        visibility: change.visibility,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (view: SavedView) => crmApi.savedViews.remove(view.id),
    onSuccess: async () => {
      setSelectedId(null);
      onApply(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: fail,
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Vista guardada"
        className={selectClassName}
        onChange={(event) => {
          const id = event.target.value ? Number(event.target.value) : null;
          setSelectedId(id);
          setError(null);
          onApply(items.find((view) => view.id === id) ?? null);
        }}
        value={selectedId ?? ""}
      >
        <option value="">Sin vista</option>
        {items.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name}
          </option>
        ))}
      </select>
      {selected && !ownsSelected && selected.owner ? (
        <span className="text-muted text-xs">
          Compartida por {selected.owner.name}
        </span>
      ) : null}
      {canManage && selected && ownsSelected ? (
        <>
          <select
            aria-label={"Compartir vista " + selected.name}
            className={selectClassName}
            disabled={share.isPending}
            onChange={(event) => {
              setError(null);
              share.mutate({
                view: selected,
                visibility: event.target.value as ViewVisibility,
              });
            }}
            value={selected.visibility}
          >
            {visibilityOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            aria-label={"Eliminar vista " + selected.name}
            disabled={remove.isPending}
            onClick={() => remove.mutate(selected)}
            size="icon"
            variant="ghost"
          >
            <Trash2 size={15} />
          </Button>
        </>
      ) : null}
      {canManage && !naming ? (
        <Button
          className="text-xs"
          onClick={() => {
            setError(null);
            setNaming(true);
          }}
          size="sm"
          variant="ghost"
        >
          <BookmarkPlus size={15} />
          Guardar vista
        </Button>
      ) : null}
      {canManage && naming ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            setError(null);
            save.mutate();
          }}
        >
          <Input
            aria-label="Nombre de la vista"
            autoFocus
            className="h-9 w-40"
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la vista"
            value={name}
          />
          <select
            aria-label="Quién puede ver la vista"
            className={selectClassName}
            onChange={(event) =>
              setVisibility(event.target.value as ViewVisibility)
            }
            value={visibility}
          >
            {visibilityOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button disabled={save.isPending} size="sm" type="submit">
            Guardar
          </Button>
          <Button
            onClick={() => {
              stopNaming();
              setError(null);
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancelar
          </Button>
        </form>
      ) : null}
      {error ? (
        <p className="text-danger w-full text-xs font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
