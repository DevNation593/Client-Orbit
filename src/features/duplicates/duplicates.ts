/** One candidate of `POST /contacts/duplicate-check` and its organization twin. */
export interface DuplicateCandidate {
  id: number;
  type: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  /** Only organizations carry it. */
  website?: string | null;
  score: number;
  confidence: "high" | "medium" | "low";
  matched_fields: string[];
  updated_at: string | null;
}

/** A field the merge endpoints accept in `field_overrides`. */
export interface MergeField {
  name: string;
  label: string;
}

function read(record: object, field: string): unknown {
  return (record as Record<string, unknown>)[field];
}

export const matchedFieldLabels: Record<string, string> = {
  email: "correo",
  phone: "teléfono",
  name: "nombre",
  identification: "identificación",
  tax_id: "identificación fiscal",
  company: "empresa",
  website: "sitio web",
};

export const confidenceLabels: Record<
  DuplicateCandidate["confidence"],
  string
> = {
  high: "alta",
  medium: "media",
  low: "baja",
};

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === "";
}

function comparable(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

/**
 * Fields where both records hold a different value. The merge keeps the
 * target's value and fills its empty fields from the duplicate, so these are
 * the only ones where there is something to decide.
 */
export function conflictingFields(
  target: object,
  duplicate: object,
  fields: MergeField[],
): MergeField[] {
  return fields.filter(({ name }) => {
    const [ours, theirs] = [read(target, name), read(duplicate, name)];
    return (
      !isEmpty(ours) &&
      !isEmpty(theirs) &&
      comparable(ours) !== comparable(theirs)
    );
  });
}

/** `field_overrides` taking the duplicate's value for the chosen fields. */
export function buildOverrides(
  duplicate: object,
  chosen: string[],
): Record<string, unknown> | undefined {
  if (!chosen.length) return undefined;
  return Object.fromEntries(
    chosen.map((name) => [name, read(duplicate, name)]),
  );
}

/** Text of a field in the side by side comparison of a merge. */
export function displayValue(record: object, field: string): string {
  if (field === "owner_id") {
    const owner = read(record, "owner") as { name?: string } | null | undefined;
    if (owner?.name) return owner.name;
  }
  return String(read(record, field));
}
