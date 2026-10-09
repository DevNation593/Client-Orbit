"use client";

import { crmApi } from "@/lib/api/resources";
import type { Organization } from "@/types/domain";
import { RecordDuplicates, type DuplicateKind } from "./record-duplicates";

const organizationDuplicateKind: DuplicateKind = {
  queryKey: "organizations",
  route: "/organizations/",
  thisRecord: "esta organización",
  thisLabel: "Esta organización",
  dialogTitle: "Fusionar organización duplicada",
  // The fields `POST /organizations/{id}/merge` accepts in `field_overrides`.
  fields: [
    { name: "name", label: "Nombre comercial" },
    { name: "legal_name", label: "Razón social" },
    { name: "email", label: "Correo" },
    { name: "phone", label: "Teléfono" },
    { name: "website", label: "Sitio web" },
    { name: "owner_id", label: "Responsable" },
  ],
  check: crmApi.organizations.duplicateCheck,
  get: crmApi.organizations.get,
  merge: crmApi.organizations.merge,
};

export function OrganizationDuplicates({
  organization,
}: {
  organization: Organization;
}) {
  return (
    <RecordDuplicates
      criteria={{
        name: organization.name,
        email: organization.email ?? null,
        phone: organization.phone ?? null,
        website: organization.website ?? null,
      }}
      kind={organizationDuplicateKind}
      record={organization}
    />
  );
}
