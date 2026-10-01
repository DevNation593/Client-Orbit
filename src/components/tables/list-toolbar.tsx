"use client";

import { Filter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ListToolbarProps {
  search?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  activeFilters?: number;
  onClearFilters?: () => void;
}

export function ListToolbar({
  search = "",
  onSearch,
  placeholder = "Buscar…",
  actionLabel,
  onAction,
  children,
  activeFilters = 0,
  onClearFilters,
}: ListToolbarProps) {
  return (
    <div className="border-border mb-4 flex flex-col gap-3 rounded-2xl border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="text-muted absolute top-2.5 left-3" size={17} />
          <Input
            aria-label={placeholder}
            className="bg-surface-subtle h-10 border-transparent pl-10 shadow-none"
            placeholder={placeholder}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
          {search ? (
            <button
              aria-label="Limpiar búsqueda"
              className="text-muted hover:text-foreground absolute top-2.5 right-3"
              onClick={() => onSearch("")}
              type="button"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        ) : null}
        {activeFilters > 0 ? (
          <Button
            className="text-xs"
            size="sm"
            variant="outline"
            onClick={onClearFilters}
          >
            <Filter size={14} />
            {activeFilters} filtro{activeFilters > 1 ? "s" : ""}
          </Button>
        ) : (
          <Button
            aria-label="Configurar filtros"
            className="text-muted hidden sm:inline-flex"
            size="sm"
            variant="ghost"
          >
            <SlidersHorizontal size={15} />
            Filtros
          </Button>
        )}
      </div>
      {onAction ? (
        <Button className="shrink-0" onClick={onAction}>
          <Plus size={16} />
          {actionLabel ?? "Nuevo"}
        </Button>
      ) : null}
    </div>
  );
}
