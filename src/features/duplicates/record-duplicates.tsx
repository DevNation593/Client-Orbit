"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyCheck } from "lucide-react";
import { useState } from "react";
import { hasPermission } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/error";
import { useAuthStore } from "@/lib/auth-store";
import {
  buildOverrides,
  confidenceLabels,
  conflictingFields,
  displayValue,
  matchedFieldLabels,
  type DuplicateCandidate,
  type MergeField,
} from "./duplicates";

type MergeRecord = { id: number };

/** What changes between merging contacts and merging organizations. */
export interface DuplicateKind {
  /** Root of the query keys to refresh after a merge. */
  queryKey: string;
  /** Path of a record's page, without the id. */
  route: string;
  /** "este contacto", "esta organización". */
  thisRecord: string;
  /** Label of a radio that keeps this record's value: "Este contacto". */
  thisLabel: string;
  dialogTitle: string;
  fields: MergeField[];
  check: (criteria: Record<string, unknown>) => Promise<DuplicateCandidate[]>;
  get: (id: number) => Promise<MergeRecord>;
  merge: (
    id: number,
    body: { duplicate_id: number; field_overrides?: Record<string, unknown> },
  ) => Promise<unknown>;
}

interface RecordDuplicatesProps {
  kind: DuplicateKind;
  record: MergeRecord;
  /** Data of the record sent to the duplicate check. */
  criteria: Record<string, unknown>;
}

export function RecordDuplicates(props: RecordDuplicatesProps) {
  const user = useAuthStore((state) => state.user);
  // Merging is the only action offered here, so the check is skipped for
  // users who could not act on its result.
  const allowed =
    !!user &&
    hasPermission(
      "duplicates.manage",
      user.permissions,
      user.is_platform_admin,
    );
  return allowed ? <DuplicateList {...props} /> : null;
}

/** Why a candidate matched, as shown wherever candidates are listed. */
export function CandidateSummary({
  candidate,
  route,
}: {
  candidate: DuplicateCandidate;
  route: string;
}) {
  return (
    <div className="min-w-0">
      <Link
        className="hover:text-brand block truncate text-sm font-semibold"
        href={route + candidate.id}
      >
        {candidate.display_name}
      </Link>
      <p className="text-muted truncate text-xs">
        {candidate.email ?? candidate.phone ?? "Sin datos de contacto"}
      </p>
      <p className="text-muted mt-1 text-xs">
        Coincide en:{" "}
        {candidate.matched_fields
          .map((field) => matchedFieldLabels[field] ?? field)
          .join(", ")}
      </p>
      <p className="text-muted text-xs">
        Confianza {confidenceLabels[candidate.confidence]} · {candidate.score}
        /100
      </p>
    </div>
  );
}

function DuplicateList({ kind, record, criteria }: RecordDuplicatesProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<DuplicateCandidate | null>(null);
  // Fields where the duplicate's value replaces this record's.
  const [fromDuplicate, setFromDuplicate] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const check = { ...criteria, exclude_id: record.id };
  const duplicates = useQuery({
    queryKey: [kind.queryKey, record.id, "duplicates", check],
    queryFn: () => kind.check(check),
  });
  const duplicate = useQuery({
    queryKey: [kind.queryKey, selected?.id],
    queryFn: () => kind.get(selected?.id ?? 0),
    enabled: selected !== null,
  });
  const close = () => {
    setSelected(null);
    setFromDuplicate([]);
  };
  const merge = useMutation({
    mutationFn: (candidate: DuplicateCandidate) =>
      kind.merge(record.id, {
        duplicate_id: candidate.id,
        ...(duplicate.data
          ? { field_overrides: buildOverrides(duplicate.data, fromDuplicate) }
          : {}),
      }),
    onSuccess: () => {
      close();
      // Refreshes the record, its overview and its timeline as well.
      return queryClient.invalidateQueries({ queryKey: [kind.queryKey] });
    },
    onError: (reason) => {
      close();
      setError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo fusionar el duplicado.",
      );
    },
  });

  const candidates = duplicates.data ?? [];
  if (!candidates.length) return null;
  const conflicts = duplicate.data
    ? conflictingFields(record, duplicate.data, kind.fields)
    : [];

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <CopyCheck size={16} />
        {candidates.length === 1
          ? "1 posible duplicado"
          : `${candidates.length} posibles duplicados`}
      </h2>
      <ul className="mt-3 space-y-2">
        {candidates.map((candidate) => (
          <li
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"
            key={candidate.id}
          >
            <CandidateSummary candidate={candidate} route={kind.route} />
            <Button
              aria-label={"Fusionar " + candidate.display_name}
              onClick={() => {
                setError(null);
                setFromDuplicate([]);
                setSelected(candidate);
              }}
              size="sm"
              variant="outline"
            >
              Fusionar aquí
            </Button>
          </li>
        ))}
      </ul>
      {error ? (
        <p className="text-danger mt-3 text-sm font-medium" role="alert">
          {error}
        </p>
      ) : null}
      <Dialog onClose={close} open={selected !== null} title={kind.dialogTitle}>
        <p className="text-muted text-sm leading-6">
          «{selected?.display_name}» se fusionará en {kind.thisRecord}. Los
          campos vacíos se completan con los del duplicado. Sus oportunidades,
          tareas, actividades, archivos y etiquetas pasan a {kind.thisRecord}, y
          el duplicado se elimina.
        </p>
        {conflicts.length ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold">
              Elige qué valor conservar donde no coinciden:
            </p>
            {conflicts.map((field) => (
              <fieldset
                className="border-border rounded-xl border p-3"
                key={field.name}
              >
                <legend className="text-muted px-1 text-xs font-bold tracking-wide uppercase">
                  {field.label}
                </legend>
                {[
                  [kind.thisLabel, record, false] as const,
                  ["Duplicado", duplicate.data ?? record, true] as const,
                ].map(([label, source, takesDuplicate]) => (
                  <label
                    className="flex items-center gap-2 py-1 text-sm"
                    key={label}
                  >
                    <input
                      checked={
                        fromDuplicate.includes(field.name) === takesDuplicate
                      }
                      name={"merge-" + field.name}
                      onChange={() =>
                        setFromDuplicate([
                          ...fromDuplicate.filter(
                            (name) => name !== field.name,
                          ),
                          ...(takesDuplicate ? [field.name] : []),
                        ])
                      }
                      type="radio"
                    />
                    {label}: {displayValue(source, field.name)}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={close} variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={merge.isPending || duplicate.isLoading}
            onClick={() => selected && merge.mutate(selected)}
          >
            {merge.isPending ? "Fusionando…" : "Fusionar"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
