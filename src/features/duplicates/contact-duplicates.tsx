"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyCheck } from "lucide-react";
import { useState } from "react";
import { hasPermission } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/error";
import { crmApi } from "@/lib/api/resources";
import { useAuthStore } from "@/lib/auth-store";
import type { Contact } from "@/types/domain";

/** One candidate of `POST /contacts/duplicate-check`. */
export interface DuplicateCandidate {
  id: number;
  type: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  score: number;
  confidence: "high" | "medium" | "low";
  matched_fields: string[];
  updated_at: string | null;
}

const fieldLabels: Record<string, string> = {
  email: "correo",
  phone: "teléfono",
  name: "nombre",
  identification: "identificación",
  tax_id: "identificación fiscal",
  company: "empresa",
};

const confidenceLabels: Record<DuplicateCandidate["confidence"], string> = {
  high: "alta",
  medium: "media",
  low: "baja",
};

export function ContactDuplicates({ contact }: { contact: Contact }) {
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
  return allowed ? <DuplicateList contact={contact} /> : null;
}

function DuplicateList({ contact }: { contact: Contact }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<DuplicateCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const criteria = {
    first_name: contact.first_name,
    last_name: contact.last_name ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    exclude_id: contact.id,
  };
  const duplicates = useQuery({
    queryKey: ["contacts", contact.id, "duplicates", criteria],
    queryFn: () => crmApi.contacts.duplicateCheck(criteria),
  });
  const merge = useMutation({
    mutationFn: (candidate: DuplicateCandidate) =>
      crmApi.contacts.merge(contact.id, { duplicate_id: candidate.id }),
    onSuccess: () => {
      setSelected(null);
      // Refreshes the contact, its overview and its timeline as well.
      return queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (reason) => {
      setSelected(null);
      setError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo fusionar el contacto.",
      );
    },
  });

  const candidates = duplicates.data ?? [];
  if (!candidates.length) return null;

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
            <div className="min-w-0">
              <Link
                className="hover:text-brand block truncate text-sm font-semibold"
                href={"/contacts/" + candidate.id}
              >
                {candidate.display_name}
              </Link>
              <p className="text-muted truncate text-xs">
                {candidate.email ?? candidate.phone ?? "Sin datos de contacto"}
              </p>
              <p className="text-muted mt-1 text-xs">
                Coincide en:{" "}
                {candidate.matched_fields
                  .map((field) => fieldLabels[field] ?? field)
                  .join(", ")}
              </p>
              <p className="text-muted text-xs">
                Confianza {confidenceLabels[candidate.confidence]} ·{" "}
                {candidate.score}/100
              </p>
            </div>
            <Button
              aria-label={"Fusionar " + candidate.display_name}
              onClick={() => {
                setError(null);
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
      <Dialog
        onClose={() => setSelected(null)}
        open={selected !== null}
        title="Fusionar contacto duplicado"
      >
        <p className="text-muted text-sm leading-6">
          «{selected?.display_name}» se fusionará en este contacto. Se conservan
          los datos de este contacto y los campos vacíos se completan con los
          del duplicado. Sus oportunidades, tareas, actividades, archivos y
          etiquetas pasan a este contacto, y el duplicado se elimina.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setSelected(null)} variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={merge.isPending}
            onClick={() => selected && merge.mutate(selected)}
          >
            {merge.isPending ? "Fusionando…" : "Fusionar"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
