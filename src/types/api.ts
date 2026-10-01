export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface ApiErrorPayload {
  message: string;
  errors: Record<string, string[]>;
}

export type QueryValue =
  string | number | boolean | null | undefined | string[];
export type QueryParams = Record<string, QueryValue>;
