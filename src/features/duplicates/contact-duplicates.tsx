"use client";

import { crmApi } from "@/lib/api/resources";
import type { Contact } from "@/types/domain";
import { RecordDuplicates, type DuplicateKind } from "./record-duplicates";

export const contactDuplicateKind: DuplicateKind = {
  queryKey: "contacts",
  route: "/contacts/",
  thisRecord: "este contacto",
  thisLabel: "Este contacto",
  dialogTitle: "Fusionar contacto duplicado",
  // The fields `POST /contacts/{id}/merge` accepts in `field_overrides`.
  fields: [
    { name: "first_name", label: "Nombre" },
    { name: "last_name", label: "Apellido" },
    { name: "email", label: "Correo" },
    { name: "phone", label: "Teléfono" },
    { name: "status", label: "Estado" },
    { name: "owner_id", label: "Responsable" },
  ],
  check: crmApi.contacts.duplicateCheck,
  get: crmApi.contacts.get,
  merge: crmApi.contacts.merge,
};

export function ContactDuplicates({ contact }: { contact: Contact }) {
  return (
    <RecordDuplicates
      criteria={{
        first_name: contact.first_name,
        last_name: contact.last_name ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
      }}
      kind={contactDuplicateKind}
      record={contact}
    />
  );
}
