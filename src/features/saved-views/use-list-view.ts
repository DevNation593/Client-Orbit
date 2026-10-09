"use client";

import { useState } from "react";
import { usePersistedState } from "@/hooks/use-persisted-state";
import type { JsonValue } from "@/types/api";
import {
  filtersToQuery,
  nextSort,
  sortToQuery,
  viewColumnVisibility,
  viewSort,
  type ListSort,
  type SavedView,
  type SavedViewFilter,
} from "./saved-views";

// Stable defaults: usePersistedState resets when its initial value changes.
const NO_FILTERS: SavedViewFilter[] = [];
const ALL_COLUMNS_VISIBLE: Record<string, boolean> = {};

function isEquals(filter: SavedViewFilter, field: string) {
  return filter.field === field && filter.operator === "eq";
}

/**
 * Filters, order, visible columns and page of a list, kept per tenant in the
 * browser and replaceable as a whole by a saved view.
 *
 * `sortFields` maps a column key to the field the endpoint accepts in `sort`.
 */
export function useListView(
  key: string,
  {
    columns,
    sortFields,
  }: { columns: string[]; sortFields: Record<string, string> },
) {
  const [filters, setStoredFilters] = usePersistedState(
    key + ".filters",
    NO_FILTERS,
  );
  const [columnVisibility, setColumnVisibility] = usePersistedState(
    key + ".columns",
    ALL_COLUMNS_VISIBLE,
  );
  const [sort, setSort] = usePersistedState<ListSort | null>(
    key + ".sort",
    null,
  );
  const [page, setPage] = useState(1);

  const setFilters = (next: SavedViewFilter[]) => {
    setStoredFilters(next);
    setPage(1);
  };

  return {
    filters,
    sort,
    columnVisibility,
    setColumnVisibility,
    page,
    setPage,
    /** Parameters of the list request that come from filters and order. */
    query: { ...filtersToQuery(filters), ...sortToQuery(sort) },
    /** Value of the "equals" filter on `field`, if there is one. */
    filterValue: (field: string): JsonValue | undefined =>
      filters.find((filter) => isEquals(filter, field))?.value,
    /** Replaces the "equals" filter on `field`; an empty value removes it. */
    setFilter: (field: string, value: string | number | null) =>
      setFilters([
        ...filters.filter((filter) => !isEquals(filter, field)),
        ...(value === null || value === ""
          ? []
          : [{ field, operator: "eq", value }]),
      ]),
    clearFilters: () => setFilters(NO_FILTERS),
    /** Props for `DataTable`. */
    sorting: {
      sortKey: columns.find((column) => sortFields[column] === sort?.field),
      sortDirection: sort?.direction,
      onSort: (column: string) => {
        const field = sortFields[column];
        if (!field) return;
        setSort(nextSort(sort, field));
        setPage(1);
      },
    },
    /** Props for `SavedViewsMenu`. */
    views: {
      filters,
      sort,
      columns,
      columnVisibility,
      onApply: (view: SavedView | null) => {
        if (!view) return;
        setFilters(view.filters);
        setSort(viewSort(view));
        setColumnVisibility(viewColumnVisibility(view, columns));
      },
    },
  };
}
