import type { JsonValue, QueryParams } from "@/types/api";
import type { OwnerReference } from "@/types/domain";

export interface SavedViewFilter {
  field: string;
  operator: string;
  value: JsonValue;
}

/** `team` shares a view with the people who have the owner's role. */
export type ViewVisibility = "private" | "team" | "tenant";

/** Order of a list, by a field the list endpoint accepts in `sort`. */
export interface ListSort {
  field: string;
  direction: "asc" | "desc";
}

/** One row of `GET /saved-views`. */
export interface SavedView {
  id: number;
  entity_type: string;
  name: string;
  visibility: ViewVisibility;
  sort_field: string | null;
  sort_direction: "asc" | "desc" | null;
  columns: string[] | null;
  is_default: boolean;
  user_id: number;
  owner?: OwnerReference | null;
  filters: SavedViewFilter[];
}

export interface SavedViewPayload {
  entity_type: string;
  name: string;
  visibility: ViewVisibility;
  sort_field: string | null;
  sort_direction: "asc" | "desc" | null;
  columns: string[];
  filters: SavedViewFilter[];
}

/** Query parameters for a list endpoint: `filter[field][operator|value]`. */
export function filtersToQuery(filters: SavedViewFilter[]): QueryParams {
  const query: QueryParams = {};
  for (const { field, operator, value } of filters) {
    query[`filter[${field}][operator]`] = operator;
    if (Array.isArray(value))
      query[`filter[${field}][value][]`] = value.map(String);
    else if (value !== null && typeof value !== "object")
      query[`filter[${field}][value]`] = value;
  }
  return query;
}

/** Query parameters for a list endpoint: `sort` and `direction`. */
export function sortToQuery(sort: ListSort | null): QueryParams {
  return sort ? { sort: sort.field, direction: sort.direction } : {};
}

/** Ascending, then descending, then back to the default order of the list. */
export function nextSort(
  current: ListSort | null,
  field: string,
): ListSort | null {
  if (current?.field !== field) return { field, direction: "asc" };
  return current.direction === "asc" ? { field, direction: "desc" } : null;
}

export function viewSort(view: SavedView): ListSort | null {
  return view.sort_field
    ? { field: view.sort_field, direction: view.sort_direction ?? "asc" }
    : null;
}

/** A view without a column list leaves every column visible. */
export function viewColumnVisibility(
  view: SavedView,
  columns: string[],
): Record<string, boolean> {
  const listed = view.columns?.length ? view.columns : columns;
  return Object.fromEntries(
    columns.map((column) => [column, listed.includes(column)]),
  );
}

export function buildViewPayload({
  entityType,
  name,
  filters,
  sort,
  columns,
  columnVisibility,
  visibility = "private",
}: {
  entityType: string;
  name: string;
  filters: SavedViewFilter[];
  sort: ListSort | null;
  columns: string[];
  columnVisibility: Record<string, boolean>;
  visibility?: ViewVisibility;
}): SavedViewPayload {
  return {
    entity_type: entityType,
    name: name.trim(),
    visibility,
    sort_field: sort?.field ?? null,
    sort_direction: sort?.direction ?? null,
    columns: columns.filter((column) => columnVisibility[column] !== false),
    filters,
  };
}
