"use client";

import { FileText } from "lucide-react";
import { FieldDefinition } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";

interface CustomFieldRendererProps {
  field: FieldDefinition;
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function CustomFieldRenderer({
  field,
  id,
  value,
  onChange,
  error,
}: CustomFieldRendererProps) {
  const label = (
    <Label htmlFor={id}>
      {field.label}
      {field.required ? <span className="text-danger ml-1">*</span> : null}
    </Label>
  );
  if (field.type === "textarea")
    return (
      <>
        {label}
        <Textarea
          id={id}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
        <FieldError message={error} />
      </>
    );
  if (field.type === "boolean")
    return (
      <>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            checked={Boolean(value)}
            className="border-border text-brand focus:ring-brand h-4 w-4 rounded"
            id={id}
            onChange={(event) => onChange(event.target.checked)}
            type="checkbox"
          />
          {field.label}
          {field.required ? <span className="text-danger">*</span> : null}
        </label>
        <FieldError message={error} />
      </>
    );
  if (field.type === "select")
    return (
      <>
        {label}
        <Select
          id={id}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Selecciona una opción</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <FieldError message={error} />
      </>
    );
  if (field.type === "multi_select")
    return (
      <>
        {label}
        <div className="border-border bg-surface-subtle space-y-2 rounded-xl border p-3">
          {(field.options ?? []).map((option) => {
            const selected = Array.isArray(value) && value.includes(option);
            return (
              <label className="flex items-center gap-2 text-sm" key={option}>
                <input
                  checked={selected}
                  className="border-border text-brand focus:ring-brand h-4 w-4 rounded"
                  onChange={(event) => {
                    const current = Array.isArray(value)
                      ? value.map(String)
                      : [];
                    onChange(
                      event.target.checked
                        ? [...current, option]
                        : current.filter((entry) => entry !== option),
                    );
                  }}
                  type="checkbox"
                />
                {option}
              </label>
            );
          })}
        </div>
        <FieldError message={error} />
      </>
    );
  if (field.type === "file")
    return (
      <>
        {label}
        <label className="border-border bg-surface-subtle text-muted hover:border-brand hover:text-brand flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm">
          <FileText size={17} />
          <span>{value ? String(value) : "Seleccionar archivo"}</span>
          <input
            className="sr-only"
            id={id}
            onChange={(event) => onChange(event.target.files?.[0]?.name ?? "")}
            type="file"
          />
        </label>
        <FieldError message={error} />
      </>
    );
  const inputType =
    field.type === "number" ||
    field.type === "decimal" ||
    field.type === "currency"
      ? "number"
      : field.type === "date"
        ? "date"
        : field.type === "datetime"
          ? "datetime-local"
          : field.type === "email"
            ? "email"
            : field.type === "url"
              ? "url"
              : field.type === "phone"
                ? "tel"
                : "text";
  return (
    <>
      {label}
      <Input
        id={id}
        step={inputType === "number" ? "any" : undefined}
        type={inputType}
        value={String(value ?? "")}
        onChange={(event) =>
          onChange(
            inputType === "number"
              ? event.target.value === ""
                ? undefined
                : Number(event.target.value)
              : event.target.value,
          )
        }
      />
      <FieldError message={error} />
    </>
  );
}
