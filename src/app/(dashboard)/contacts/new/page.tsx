"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateContact, useFieldDefinitions } from "@/hooks/use-crm";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { RecordForm } from "@/components/forms/record-form";
import { Button } from "@/components/ui/button";
import type { DuplicateCandidate } from "@/features/duplicates/duplicates";
import { CandidateSummary } from "@/features/duplicates/record-duplicates";
import { ApiError } from "@/lib/api/error";
import { crmApi } from "@/lib/api/resources";

type FormValues = Record<string, unknown>;

/** Contacts that look like the one about to be created. */
async function findLookalikes(values: FormValues) {
  try {
    return await crmApi.contacts.duplicateCheck({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
    });
  } catch {
    // The check is advisory: failing to run it must not block the creation.
    return [];
  }
}

export default function NewContactPage() {
  const router = useRouter();
  const fields = useFieldDefinitions("contacts");
  const create = useCreateContact();
  // A creation held back until the user has seen its possible duplicates.
  const [pending, setPending] = useState<{
    values: FormValues;
    candidates: DuplicateCandidate[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createContact = async (values: FormValues) => {
    const contact = await create.mutateAsync(values);
    router.replace(`/contacts/${contact.id}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Contactos"
        title="Nuevo contacto"
        description="Añade una persona y completa la información relevante para tu equipo."
        action={
          <Button variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
        }
      />
      <Card>
        <CardContent className="p-5 md:p-7">
          <RecordForm
            customFields={fields.data ?? []}
            kind="contact"
            onSubmit={async (values) => {
              const candidates = await findLookalikes(values);
              if (!candidates.length) return createContact(values);
              setError(null);
              setPending({ values, candidates });
            }}
            submitLabel="Crear contacto"
          />
        </CardContent>
      </Card>
      <Dialog
        description="Revisa si alguno es la misma persona antes de crear otro registro."
        onClose={() => setPending(null)}
        open={pending !== null}
        title={
          pending?.candidates.length === 1
            ? "Ya existe un contacto parecido"
            : "Ya existen contactos parecidos"
        }
      >
        <ul className="space-y-2">
          {pending?.candidates.map((candidate) => (
            <li
              className="border-border rounded-xl border p-3"
              key={candidate.id}
            >
              <CandidateSummary candidate={candidate} route="/contacts/" />
            </li>
          ))}
        </ul>
        {error ? (
          <p className="text-danger mt-3 text-sm font-medium" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setPending(null)} variant="secondary">
            Revisar datos
          </Button>
          <Button
            disabled={create.isPending}
            onClick={() => {
              if (!pending) return;
              setError(null);
              createContact(pending.values).catch((reason: unknown) =>
                setError(
                  reason instanceof ApiError
                    ? (Object.values(reason.fieldErrors)[0]?.[0] ??
                        reason.message)
                    : "No se pudo crear el contacto.",
                ),
              );
            }}
          >
            {create.isPending ? "Creando…" : "Crear de todos modos"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
