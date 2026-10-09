import type { JsonValue } from "@/types/api";
import type { ActivityType, OwnerReference } from "@/types/domain";

/** One row of `GET /contacts/{id}/timeline`. */
export interface TimelineEvent {
  id: string;
  source: "activity" | "audit" | "quote";
  event: string;
  subject: string | null;
  body: string | null;
  entity: { type: string | null; id: number | string | null };
  actor: OwnerReference | null;
  /** Empty metadata arrives as `[]`, not `{}`. */
  metadata: Record<string, JsonValue> | [];
  occurred_at: string;
}

/** What the timeline component renders, whatever the source of the event. */
export interface TimelineEntry {
  id: number | string;
  type: ActivityType;
  subject?: string | null;
  body?: string | null;
  user?: OwnerReference | null;
  occurred_at?: string | null;
  created_at?: string;
}

const loggedTypes: ReadonlySet<string> = new Set<ActivityType>([
  "call",
  "meeting",
  "email",
  "whatsapp",
  "note",
  "task",
  "quote",
  "deal",
  "ticket",
  "status_change",
  "automation",
  "system",
]);

/** Domain events are namespaced (`opportunity.won`); the prefix decides the tab. */
const typeByPrefix: Record<string, ActivityType> = {
  email: "email",
  whatsapp: "whatsapp",
  meeting: "meeting",
  task: "task",
  opportunity: "deal",
  quote: "quote",
};

const eventLabels: Record<string, string> = {
  "contact.created": "Contacto creado",
  "contact.updated": "Contacto actualizado",
  "contact.merged": "Contacto fusionado",
  "company.created": "Organización creada",
  "company.updated": "Organización actualizada",
  "lead.created": "Lead creado",
  "lead.assigned": "Lead asignado",
  "lead.converted": "Lead convertido",
  "opportunity.created": "Oportunidad creada",
  "opportunity.stage_changed": "Oportunidad cambió de etapa",
  "opportunity.won": "Oportunidad ganada",
  "opportunity.lost": "Oportunidad perdida",
  "task.created": "Tarea creada",
  "task.completed": "Tarea completada",
  "audit.create": "Registro creado",
  "audit.update": "Registro actualizado",
  "audit.delete": "Registro eliminado",
};

const MAX_LISTED_FIELDS = 6;

/** Bookkeeping columns the audit log reports alongside the real changes. */
function isInternalField(field: string) {
  return (
    ["id", "tenant_id", "created_at", "updated_at", "deleted_at"].includes(
      field,
    ) || field.endsWith("_normalized")
  );
}

function entryType(event: TimelineEvent): ActivityType {
  if (event.source === "audit") return "system";
  if (event.source === "quote") return "quote";
  if (loggedTypes.has(event.event)) return event.event as ActivityType;
  return typeByPrefix[event.event.split(".")[0] ?? ""] ?? "system";
}

function changedFields(event: TimelineEvent) {
  if (Array.isArray(event.metadata)) return null;
  const reported = event.metadata.changed_fields;
  if (!Array.isArray(reported)) return null;
  const fields = reported
    .filter((field): field is string => typeof field === "string")
    .filter((field) => !isInternalField(field));
  if (!fields.length) return null;
  const listed = fields.slice(0, MAX_LISTED_FIELDS).join(", ");
  const rest = fields.length - MAX_LISTED_FIELDS;
  return "Campos modificados: " + listed + (rest > 0 ? ` y ${rest} más` : "");
}

export function timelineEventToEntry(event: TimelineEvent): TimelineEntry {
  return {
    id: event.id,
    type: entryType(event),
    subject: eventLabels[event.event] ?? event.subject,
    body: changedFields(event) ?? event.body,
    user: event.actor,
    occurred_at: event.occurred_at,
  };
}
