"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import type { FieldDefinition } from "@/types/domain";
import type { JsonValue } from "@/types/api";
import { applyServerErrors } from "@/features/auth/utils";
import { ApiError } from "@/lib/api/error";
import { CustomFieldRenderer } from "./custom-field-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";
import type { Organization, Pipeline } from "@/types/domain";
import type { ReactNode } from "react";

export type RecordKind = "contact" | "organization" | "lead" | "deal" | "task";
type FormValues = Record<string, unknown>;

interface RecordFormProps {
  kind: RecordKind;
  defaultValues?: FormValues;
  customFields?: FieldDefinition[];
  pipelines?: Pipeline[];
  organizations?: Organization[];
  submitLabel?: string;
  onSubmit: (values: FormValues) => Promise<void> | void;
}

const baseSchemas: Record<RecordKind, z.ZodRawShape> = {
  contact: {
    first_name: z.string().min(1, "El nombre es obligatorio."),
    email: z.string().email("Escribe un correo válido.").or(z.literal("")),
    status: z.string().optional(),
  },
  organization: {
    name: z.string().min(1, "El nombre es obligatorio."),
    email: z.string().email("Escribe un correo válido.").or(z.literal("")),
    website: z.string().url("Escribe una URL válida.").or(z.literal("")),
  },
  lead: {
    email: z.string().email("Escribe un correo válido.").or(z.literal("")),
    score: z.coerce.number().min(0).max(100).optional().or(z.nan()),
  },
  deal: {
    name: z.string().min(1, "El nombre es obligatorio."),
    pipeline_id: z.coerce.number().int().positive("Selecciona un pipeline."),
    stage_id: z.coerce.number().int().positive("Selecciona una etapa."),
    value: z.coerce.number().min(0, "El valor no puede ser negativo."),
    currency: z
      .string()
      .length(3, "Usa una moneda de 3 letras.")
      .transform((value) => value.toUpperCase()),
  },
  task: { title: z.string().min(1, "El título es obligatorio.") },
};

export function RecordForm({
  kind,
  defaultValues,
  customFields = [],
  pipelines = [],
  organizations = [],
  submitLabel = "Guardar cambios",
  onSubmit,
}: RecordFormProps) {
  const schema = buildSchema(kind, customFields);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { custom_fields: {}, ...defaultValues },
  });
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const pipelineValue = useWatch({ control, name: "pipeline_id" });
  const stageValue = useWatch({ control, name: "stage_id" });
  const customValues =
    (watch("custom_fields") as Record<string, JsonValue> | undefined) ?? {};
  useEffect(() => {
    if (kind !== "deal" || !pipelines.length) return;

    const selectedPipeline = pipelines.find(
      (pipeline) => String(pipeline.id) === String(pipelineValue ?? ""),
    );
    if (!selectedPipeline) {
      const initialPipeline =
        pipelines.find((pipeline) => pipeline.is_default) ?? pipelines[0];
      setValue("pipeline_id", initialPipeline.id, { shouldValidate: true });
      if (initialPipeline.stages[0] && !stageValue) {
        setValue("stage_id", initialPipeline.stages[0].id, {
          shouldValidate: true,
        });
      }
      return;
    }

    if (
      !selectedPipeline.stages.some(
        (stage) => String(stage.id) === String(stageValue ?? ""),
      )
    ) {
      setValue("stage_id", selectedPipeline.stages[0]?.id ?? "", {
        shouldValidate: true,
      });
    }
  }, [kind, pipelines, pipelineValue, setValue, stageValue]);
  const submit = async (values: FormValues) => {
    try {
      await onSubmit(cleanPayload(values));
    } catch (error) {
      applyServerErrors(error, setError);
      if (
        error instanceof ApiError &&
        Object.keys(error.fieldErrors).length === 0
      )
        setError("root", { message: error.message });
    }
  };
  const errorFor = (name: string) =>
    (errors[name] as { message?: string } | undefined)?.message;
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => void handleSubmit(submit)(event)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {renderStandardFields(
          kind,
          register,
          errorFor,
          pipelines,
          organizations,
          pipelineValue,
          setValue,
        )}
      </div>
      {customFields.length ? (
        <section className="border-border border-t pt-6">
          <div className="mb-4">
            <h3 className="font-bold">Información adicional</h3>
            <p className="text-muted mt-1 text-sm">
              Campos configurados por tu organización.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {customFields.map((field) => (
              <div key={field.id}>
                <CustomFieldRenderer
                  field={field}
                  id={`custom_fields.${field.name}`}
                  value={customValues[field.name]}
                  onChange={(value) =>
                    setValue(
                      "custom_fields",
                      { ...customValues, [field.name]: value },
                      { shouldDirty: true, shouldValidate: true },
                    )
                  }
                  error={
                    (
                      (
                        errors.custom_fields as
                          FieldErrors<Record<string, unknown>> | undefined
                      )?.[field.name] as { message?: string } | undefined
                    )?.message
                  }
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {errors.root?.message ? (
        <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
          {errors.root.message}
        </p>
      ) : null}
      <div className="border-border flex justify-end gap-2 border-t pt-5">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function buildSchema(kind: RecordKind, customFields: FieldDefinition[]) {
  const customShape: z.ZodRawShape = {};
  customFields.forEach((field) => {
    let value: z.ZodTypeAny = z.unknown();
    if (["number", "decimal", "currency"].includes(field.type))
      value = z.coerce.number();
    if (field.type === "boolean") value = z.boolean();
    if (field.type === "multi_select") value = z.array(z.string());
    if (field.required)
      value = value.refine(
        (entry) =>
          entry !== undefined &&
          entry !== null &&
          entry !== "" &&
          !(Array.isArray(entry) && entry.length === 0),
        `${field.label} es obligatorio.`,
      );
    else value = value.optional();
    customShape[field.name] = value;
  });
  return z
    .object({
      ...baseSchemas[kind],
      custom_fields: z.object(customShape).passthrough().optional(),
    })
    .passthrough();
}

function renderStandardFields(
  kind: RecordKind,
  register: ReturnType<typeof useForm<FormValues>>["register"],
  errorFor: (name: string) => string | undefined,
  pipelines: Pipeline[],
  organizations: Organization[],
  pipelineValue: unknown,
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"],
) {
  const field = (
    name: string,
    label: string,
    child: ReactNode,
    wide = false,
  ) => (
    <div className={wide ? "md:col-span-2" : ""} key={name}>
      <Label htmlFor={name}>{label}</Label>
      {child}
      <FieldError message={errorFor(name)} />
    </div>
  );
  if (kind === "contact")
    return (
      <>
        {field(
          "first_name",
          "Nombre",
          <Input id="first_name" {...register("first_name")} />,
        )}
        {field(
          "last_name",
          "Apellido",
          <Input id="last_name" {...register("last_name")} />,
        )}
        {field(
          "email",
          "Correo",
          <Input id="email" type="email" {...register("email")} />,
        )}
        {field(
          "phone",
          "Teléfono",
          <Input id="phone" {...register("phone")} />,
        )}
        {field(
          "status",
          "Estado",
          <Select id="status" {...register("status")}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="prospect">Prospecto</option>
          </Select>,
        )}
        {organizations.length
          ? field(
              "organization_ids",
              "Organización",
              <Select id="organization_ids" {...register("organization_ids")}>
                <option value="">Sin organización</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>,
            )
          : null}
      </>
    );
  if (kind === "organization")
    return (
      <>
        {field(
          "name",
          "Nombre comercial",
          <Input id="name" {...register("name")} />,
        )}
        {field(
          "legal_name",
          "Razón social",
          <Input id="legal_name" {...register("legal_name")} />,
        )}
        {field(
          "email",
          "Correo",
          <Input id="email" type="email" {...register("email")} />,
        )}
        {field(
          "phone",
          "Teléfono",
          <Input id="phone" {...register("phone")} />,
        )}
        {field(
          "website",
          "Sitio web",
          <Input
            id="website"
            placeholder="https://"
            {...register("website")}
          />,
        )}
      </>
    );
  if (kind === "lead")
    return (
      <>
        {field(
          "first_name",
          "Nombre",
          <Input id="first_name" {...register("first_name")} />,
        )}
        {field(
          "last_name",
          "Apellido",
          <Input id="last_name" {...register("last_name")} />,
        )}
        {field(
          "email",
          "Correo",
          <Input id="email" type="email" {...register("email")} />,
        )}
        {field(
          "phone",
          "Teléfono",
          <Input id="phone" {...register("phone")} />,
        )}
        {field(
          "source",
          "Origen",
          <Input
            id="source"
            placeholder="Web, referido, evento…"
            {...register("source")}
          />,
        )}
        {field(
          "score",
          "Puntuación",
          <Input
            id="score"
            max={100}
            min={0}
            type="number"
            {...register("score", { valueAsNumber: true })}
          />,
        )}
        {field(
          "status",
          "Estado",
          <Select id="status" {...register("status")}>
            <option value="new">Nuevo</option>
            <option value="qualified">Calificado</option>
            <option value="converted">Convertido</option>
            <option value="lost">Descartado</option>
          </Select>,
        )}
      </>
    );
  if (kind === "deal") {
    const stages =
      pipelines.find(
        (pipeline) => String(pipeline.id) === String(pipelineValue ?? ""),
      )?.stages ?? [];
    const pipelineRegistration = register("pipeline_id");
    return (
      <>
        {field(
          "name",
          "Nombre de la oportunidad",
          <Input id="name" {...register("name")} />,
          true,
        )}
        {field(
          "pipeline_id",
          "Pipeline",
          <Select
            disabled={!pipelines.length}
            id="pipeline_id"
            {...pipelineRegistration}
            onChange={(event) => {
              pipelineRegistration.onChange(event);
              setValue("stage_id", "", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          >
            <option value="">Selecciona un pipeline</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </Select>,
        )}
        {field(
          "stage_id",
          "Etapa",
          <Select
            disabled={!pipelineValue || !stages.length}
            id="stage_id"
            {...register("stage_id")}
          >
            <option value="">Selecciona una etapa</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>,
        )}
        {field(
          "value",
          "Valor",
          <Input
            id="value"
            min={0}
            step="0.01"
            type="number"
            {...register("value", { valueAsNumber: true })}
          />,
        )}
        {field(
          "currency",
          "Moneda",
          <Input
            id="currency"
            maxLength={3}
            placeholder="USD"
            {...register("currency")}
          />,
        )}
        {field(
          "expected_close_date",
          "Cierre estimado",
          <Input
            id="expected_close_date"
            type="date"
            {...register("expected_close_date")}
          />,
        )}
      </>
    );
  }
  return (
    <>
      {field(
        "title",
        "Título",
        <Input id="title" {...register("title")} />,
        true,
      )}
      {field(
        "description",
        "Descripción",
        <Textarea id="description" {...register("description")} />,
        true,
      )}
      {field(
        "priority",
        "Prioridad",
        <Select id="priority" {...register("priority")}>
          <option value="low">Baja</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </Select>,
      )}
      {field(
        "status",
        "Estado",
        <Select id="status" {...register("status")}>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </Select>,
      )}
      {field(
        "due_at",
        "Vencimiento",
        <Input id="due_at" type="datetime-local" {...register("due_at")} />,
      )}
    </>
  );
}

function cleanPayload(values: FormValues) {
  const normalized: FormValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === "") normalized[key] = undefined;
    else normalized[key] = value;
  }
  return normalized;
}
