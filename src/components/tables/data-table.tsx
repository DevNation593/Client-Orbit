"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  Download,
  Eye,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, ListSkeleton } from "@/components/common/async-state";
import { useAuthStore } from "@/lib/auth-store";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: Array<string | number>;
  onSelectionChange?: (keys: Array<string | number>) => void;
  bulkActions?: ReactNode;
  onExport?: () => void;
  exportLabel?: string;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  preferenceKey?: string;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  loading,
  emptyTitle = "No hay registros",
  emptyDescription = "Los registros aparecerán aquí cuando estén disponibles.",
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  bulkActions,
  onExport,
  exportLabel = "Exportar",
  columnVisibility,
  onColumnVisibilityChange,
  preferenceKey,
}: DataTableProps<T>) {
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const preferenceStorageKey =
    preferenceKey === undefined
      ? undefined
      : "vantex:table:" + String(tenantId ?? "default") + ":" + preferenceKey;
  const [storedVisibility, setStoredVisibility] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!preferenceStorageKey) return;
    setStoredVisibility({});
    try {
      const saved = window.localStorage.getItem(preferenceStorageKey);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (isColumnVisibility(parsed)) setStoredVisibility(parsed);
    } catch {
      // Storage can be disabled or contain an obsolete value.
    }
  }, [preferenceStorageKey]);

  const effectiveColumnVisibility =
    columnVisibility ??
    (preferenceKey === undefined ? undefined : storedVisibility);
  const handleColumnVisibilityChange = (next: Record<string, boolean>) => {
    setStoredVisibility(next);
    if (preferenceStorageKey) {
      try {
        window.localStorage.setItem(preferenceStorageKey, JSON.stringify(next));
      } catch {
        // Storage can be disabled by the browser.
      }
    }
    onColumnVisibilityChange?.(next);
  };

  if (loading) return <ListSkeleton rows={6} />;
  if (rows.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  const visibleColumns = columns.filter(
    (column) => effectiveColumnVisibility?.[column.key] !== false,
  );
  const keys = rows.map(getRowKey);
  const allSelected =
    selectable && keys.every((key) => selectedKeys.includes(key));
  const toggleAll = () => onSelectionChange?.(allSelected ? [] : keys);
  const toggleRow = (key: string | number) =>
    onSelectionChange?.(
      selectedKeys.includes(key)
        ? selectedKeys.filter((entry) => entry !== key)
        : [...selectedKeys, key],
    );
  const columnMenu =
    onColumnVisibilityChange || preferenceKey ? (
      <details className="relative">
        <summary className="text-muted hover:text-foreground flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold hover:bg-white">
          <Eye size={14} />
          Columnas
        </summary>
        <div className="border-border absolute top-9 right-0 z-20 w-48 rounded-xl border bg-white p-2 shadow-lg">
          {columns.map((column) => (
            <label
              className="hover:bg-surface-subtle flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
              key={column.key}
            >
              <input
                checked={effectiveColumnVisibility?.[column.key] !== false}
                onChange={(event) =>
                  handleColumnVisibilityChange({
                    ...effectiveColumnVisibility,
                    [column.key]: event.target.checked,
                  })
                }
                type="checkbox"
              />
              {column.header || column.key}
            </label>
          ))}
        </div>
      </details>
    ) : null;
  return (
    <div className="border-border bg-surface overflow-hidden rounded-2xl border">
      {selectedKeys.length || onExport || columnMenu ? (
        <div className="border-border bg-surface-subtle flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            {selectedKeys.length ? (
              <span className="text-foreground font-bold">
                {selectedKeys.length} seleccionados
              </span>
            ) : null}
            {bulkActions}
          </div>
          <div className="flex items-center gap-1">
            {columnMenu}
            {onExport ? (
              <button
                className="text-muted hover:text-foreground inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold hover:bg-white"
                onClick={onExport}
                type="button"
              >
                <Download size={14} />
                {exportLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-border bg-surface-subtle text-muted border-b text-xs tracking-wide uppercase">
            <tr>
              {selectable ? (
                <th className="w-12 px-4 py-3">
                  <button
                    aria-label={
                      allSelected
                        ? "Deseleccionar todas las filas"
                        : "Seleccionar todas las filas"
                    }
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border",
                      allSelected
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-white",
                    )}
                    onClick={toggleAll}
                    type="button"
                  >
                    {allSelected ? <Check size={13} /> : null}
                  </button>
                </th>
              ) : null}
              {visibleColumns.map((column) => (
                <th
                  className={cn("px-5 py-3 font-bold", column.className)}
                  key={column.key}
                >
                  {column.sortable && onSort ? (
                    <button
                      className="hover:text-foreground inline-flex items-center gap-1.5"
                      onClick={() => onSort(column.key)}
                      type="button"
                    >
                      {column.header}
                      {sortKey === column.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={13} />
                        ) : (
                          <ArrowDown size={13} />
                        )
                      ) : (
                        <ChevronsUpDown size={13} />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row) => {
              const key = getRowKey(row);
              const selected = selectedKeys.includes(key);
              return (
                <tr
                  className={cn(
                    "hover:bg-surface-subtle transition-colors",
                    onRowClick && "cursor-pointer",
                    selected && "bg-brand-soft/40",
                  )}
                  key={key}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable ? (
                    <td
                      className="px-4 py-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        aria-label={`Seleccionar fila ${key}`}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border",
                          selected
                            ? "border-brand bg-brand text-white"
                            : "border-border bg-white",
                        )}
                        onClick={() => toggleRow(key)}
                        type="button"
                      >
                        {selected ? <Check size={13} /> : null}
                      </button>
                    </td>
                  ) : null}
                  {visibleColumns.map((column) => (
                    <td
                      className={cn("px-5 py-4 align-middle", column.className)}
                      key={column.key}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isColumnVisibility(value: unknown): value is Record<string, boolean> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "boolean")
  );
}
