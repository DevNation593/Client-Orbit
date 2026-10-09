import type { JsonValue, QueryParams } from "@/types/api";
import type { OwnerReference } from "@/types/domain";

export interface SavedViewFilter {
  field: string;
  operator: string;
  value: JsonValue;
}

/** One row of `GET /saved-views`. */
export interface SavedView {
  id: number;
  entity_type: string;
  name: string;
  visibility: "private" | "team" | "tenant";
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
  visibility: "private";
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
  columns,
  columnVisibility,
}: {
  entityType: string;
  name: string;
  filters: SavedViewFilter[];
  columns: string[];
  columnVisibility: Record<string, boolean>;
}): SavedViewPayload {
  return {
    entity_type: entityType,
    name: name.trim(),
    visibility: "private",
    columns: columns.filter((column) => columnVisibility[column] !== false),
    filters,
  };
}
