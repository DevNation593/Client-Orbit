"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { QueryParams } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "starts_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "in"
  | "not_in"
  | "is_null"
  | "not_null";
const operators: Array<{ value: FilterOperator; label: string }> = [
  { value: "eq", label: "es igual a" },
  { value: "neq", label: "no es igual a" },
  { value: "contains", label: "contiene" },
  { value: "starts_with", label: "comienza con" },
  { value: "gt", label: "es mayor que" },
  { value: "gte", label: "es mayor o igual" },
  { value: "lt", label: "es menor que" },
  { value: "lte", label: "es menor o igual" },
  { value: "between", label: "está entre" },
  { value: "in", label: "está en" },
  { value: "not_in", label: "no está en" },
  { value: "is_null", label: "está vacío" },
  { value: "not_null", label: "no está vacío" },
];

export function FilterBuilder({
  fields,
  onChange,
}: {
  fields: Array<{ value: string; label: string }>;
  onChange: (filters: QueryParams) => void;
}) {
  const [rows, setRows] = useState<
    Array<{ field: string; operator: FilterOperator; value: string }>
  >([]);
  const update = (next: typeof rows) => {
    setRows(next);
    const query: QueryParams = {};
    next.forEach((row) => {
      if (!row.field) return;
      query[`filter[${row.field}][operator]`] = row.operator;
      if (!(["is_null", "not_null"] as FilterOperator[]).includes(row.operator))
        query[`filter[${row.field}][value]`] = row.value;
    });
    onChange(query);
  };
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div
          className="flex flex-wrap items-center gap-2"
          key={`${row.field}-${index}`}
        >
          <Select
            aria-label="Campo a filtrar"
            className="w-auto min-w-[140px]"
            value={row.field}
            onChange={(event) =>
              update(
                rows.map((entry, position) =>
                  position === index
                    ? { ...entry, field: event.target.value }
                    : entry,
                ),
              )
            }
          >
            <option value="">Campo</option>
            {fields.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Operador de filtro"
            className="w-auto min-w-[150px]"
            value={row.operator}
            onChange={(event) =>
              update(
                rows.map((entry, position) =>
                  position === index
                    ? {
                        ...entry,
                        operator: event.target.value as FilterOperator,
                      }
                    : entry,
                ),
              )
            }
          >
            {operators.map((operator) => (
              <option key={operator.value} value={operator.value}>
                {operator.label}
              </option>
            ))}
          </Select>
          {!(row.operator === "is_null" || row.operator === "not_null") ? (
            <Input
              aria-label="Valor del filtro"
              className="w-auto min-w-[150px]"
              placeholder="Valor"
              value={row.value}
              onChange={(event) =>
                update(
                  rows.map((entry, position) =>
                    position === index
                      ? { ...entry, value: event.target.value }
                      : entry,
                  ),
                )
              }
            />
          ) : null}
          <Button
            aria-label="Quitar filtro"
            size="icon"
            variant="ghost"
            onClick={() =>
              update(rows.filter((_, position) => position !== index))
            }
          >
            <X size={15} />
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          update([
            ...rows,
            { field: fields[0]?.value ?? "", operator: "eq", value: "" },
          ])
        }
      >
        <Plus size={14} />
        Añadir filtro
      </Button>
    </div>
  );
}
