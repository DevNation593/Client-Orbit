"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tag as TagIcon, X } from "lucide-react";
import { useId, useState } from "react";
import { hasPermission } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/error";
import { crmApi } from "@/lib/api/resources";
import { useAuthStore } from "@/lib/auth-store";
import type { Tag } from "@/types/domain";

export type TaggableType = "contact" | "organization" | "lead" | "deal";

export function RecordTags({
  entityType,
  entityId,
}: {
  entityType: TaggableType;
  entityId: number;
}) {
  const user = useAuthStore((state) => state.user);
  const can = (permission: string) =>
    !!user &&
    hasPermission(permission, user.permissions, user.is_platform_admin);
  if (!can("tags.view")) return null;
  return (
    <TagEditor
      canManage={can("tags.manage")}
      entityId={entityId}
      entityType={entityType}
    />
  );
}

function TagEditor({
  entityType,
  entityId,
  canManage,
}: {
  entityType: TaggableType;
  entityId: number;
  canManage: boolean;
}) {
  const record = { entity_type: entityType, entity_id: entityId };
  const queryClient = useQueryClient();
  const inputId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const assigned = useQuery({
    queryKey: ["tags", "assigned", entityType, entityId],
    queryFn: () => crmApi.tags.list({ ...record, per_page: 50 }),
  });
  const catalog = useQuery({
    queryKey: ["tags", "catalog"],
    queryFn: () => crmApi.tags.list({ per_page: 50 }),
    enabled: canManage,
  });

  const settle = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
    onError: (reason: unknown) =>
      setError(
        reason instanceof ApiError
          ? (Object.values(reason.fieldErrors)[0]?.[0] ?? reason.message)
          : "No se pudo actualizar las etiquetas.",
      ),
  };
  const add = useMutation({
    mutationFn: async (rawName: string) => {
      const tagName = rawName.trim();
      const matches = await crmApi.tags.list({ search: tagName, per_page: 50 });
      const tag =
        matches.items.find(
          (entry) => entry.name.toLowerCase() === tagName.toLowerCase(),
        ) ?? (await crmApi.tags.create({ name: tagName }));
      await crmApi.tags.assign(tag.id, record);
    },
    ...settle,
    onSuccess: () => {
      setName("");
      return settle.onSuccess();
    },
  });
  const remove = useMutation({
    mutationFn: async (tag: Tag) => {
      // The API removes an assignment by its own id, which tag lists do not
      // include. Assigning is idempotent and returns that id.
      const assignment = await crmApi.tags.assign(tag.id, record);
      await crmApi.tags.unassign(tag.id, assignment.id);
    },
    ...settle,
  });

  const tags = assigned.data?.items ?? [];
  const busy = add.isPending || remove.isPending;

  return (
    <div className="space-y-3">
      <p className="text-muted flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
        <TagIcon size={13} />
        Etiquetas
      </p>
      {assigned.isLoading ? (
        <div className="h-7 w-40 animate-pulse rounded-full bg-slate-100" />
      ) : assigned.isError ? (
        <p className="text-danger text-sm">
          No se pudieron cargar las etiquetas.
        </p>
      ) : tags.length ? (
        <ul aria-label="Etiquetas" className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              className="bg-brand-soft text-brand-strong inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              key={tag.id}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color ?? "#7374e8" }}
              />
              {tag.name}
              {canManage ? (
                <button
                  aria-label={"Quitar etiqueta " + tag.name}
                  className="hover:text-danger"
                  disabled={busy}
                  onClick={() => {
                    setError(null);
                    remove.mutate(tag);
                  }}
                  type="button"
                >
                  <X size={13} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted text-sm">Sin etiquetas todavía.</p>
      )}
      {canManage ? (
        <form
          className="flex max-w-sm items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            setError(null);
            add.mutate(name);
          }}
        >
          <Input
            aria-label="Añadir etiqueta"
            className="h-9"
            list={inputId}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la etiqueta"
            value={name}
          />
          <datalist id={inputId}>
            {catalog.data?.items.map((tag) => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
          <Button disabled={busy} size="sm" type="submit" variant="outline">
            Añadir
          </Button>
        </form>
      ) : null}
      {error ? (
        <p className="text-danger text-sm font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
