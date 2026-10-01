"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import type { JsonValue } from "@/types/api";
import type { FieldDefinition } from "@/types/domain";
import { CustomFieldRenderer } from "./custom-field-renderer";
import { applyServerErrors } from "@/features/auth/utils";
import { ApiError } from "@/lib/api/error";
import { Button } from "@/components/ui/button";

type FormValues = Record<string, unknown>;

export function DynamicForm({
  fields,
  defaultValues,
  submitLabel = "Guardar registro",
  onSubmit,
}: {
  fields: FieldDefinition[];
  defaultValues?: Record<string, JsonValue>;
  submitLabel?: string;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
}) {
  const schema = buildSchema(fields);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: defaultValues ?? {},
  });
  const {
    watch,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const values = watch();
  const submit = async (data: FormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(error, setError);
      if (
        error instanceof ApiError &&
        Object.keys(error.fieldErrors).length === 0
      )
        setError("root", { message: error.message });
    }
  };
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => void handleSubmit(submit)(event)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id}>
            <CustomFieldRenderer
              field={field}
              id={field.name}
              value={values[field.name]}
              onChange={(value) =>
                setValue(field.name, value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={
                (errors[field.name] as { message?: string } | undefined)
                  ?.message
              }
            />
          </div>
        ))}
      </div>
      {!fields.length ? (
        <p className="bg-surface-subtle text-muted rounded-xl p-5 text-sm">
          Esta entidad todavía no tiene campos. Añade definiciones desde
          Configuración → Campos personalizados.
        </p>
      ) : null}
      {errors.root?.message ? (
        <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
          {errors.root.message}
        </p>
      ) : null}
      <div className="border-border flex justify-end border-t pt-5">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function buildSchema(fields: FieldDefinition[]) {
  const shape: z.ZodRawShape = {};
  fields.forEach((field) => {
    let validator: z.ZodTypeAny = z.unknown();
    if (["number", "decimal", "currency"].includes(field.type))
      validator = z.coerce.number();
    if (field.type === "boolean") validator = z.boolean();
    if (field.type === "multi_select") validator = z.array(z.string());
    if (field.type === "email")
      validator = z.string().email("Escribe un correo válido.");
    if (field.type === "url")
      validator = z.string().url("Escribe una URL válida.");
    if (field.required)
      validator = validator.refine(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0),
        `${field.label} es obligatorio.`,
      );
    else validator = validator.optional();
    shape[field.name] = validator;
  });
  return z.object(shape).passthrough();
}
