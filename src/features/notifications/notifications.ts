import type { JsonValue } from "@/types/api";

/** One row of `GET /notifications`. */
export interface ApiNotification {
  id: string;
  event: string | null;
  title: string;
  body: string | null;
  priority: string | null;
  action_url: string | null;
  /** Empty context arrives as `[]`. */
  context: Record<string, JsonValue> | [];
  read_at: string | null;
  created_at: string | null;
}

const contextRoutes: Array<[key: string, route: string]> = [
  ["lead_id", "/leads/"],
  ["contact_id", "/contacts/"],
  ["deal_id", "/deals/"],
  ["task_id", "/tasks/"],
  ["organization_id", "/organizations/"],
];

/** Accepts only paths of this app; the URL comes from notification data. */
function inAppPath(actionUrl: string | null, origin: string) {
  if (!actionUrl) return undefined;
  if (actionUrl.startsWith("/") && !actionUrl.startsWith("//"))
    return actionUrl;
  try {
    const url = new URL(actionUrl);
    return url.origin === origin
      ? url.pathname + url.search + url.hash
      : undefined;
  } catch {
    return undefined;
  }
}

/** Where a notification leads inside the app, if anywhere. */
export function notificationHref(
  notification: ApiNotification,
  origin: string,
): string | undefined {
  const path = inAppPath(notification.action_url, origin);
  if (path) return path;
  const context = notification.context;
  if (Array.isArray(context)) return undefined;
  for (const [key, route] of contextRoutes) {
    const id = context[key];
    if (typeof id === "number" || typeof id === "string") return route + id;
  }
  return undefined;
}

/** One row of `GET /notification-preferences`. */
export interface NotificationPreference {
  event: string;
  channel: string;
  enabled: boolean;
  delivery: "immediate" | "daily" | "weekly";
}

/** `data` and `meta` of `GET /notification-preferences`. */
export interface NotificationPreferenceSet {
  preferences: NotificationPreference[];
  events: string[];
  channels: Array<{ key: string; operational: boolean }>;
  defaults: Record<string, boolean>;
}

export const notificationEventLabels: Record<string, string> = {
  "lead.assigned": "Lead asignado",
  "task.overdue": "Tarea vencida",
  "conversation.received": "Mensaje recibido",
  "quote.viewed": "Cotización vista",
  "opportunity.stalled": "Oportunidad estancada",
  "ticket.urgent": "Ticket urgente",
  "goal.completed": "Meta cumplida",
  "import.completed": "Importación terminada",
  "export.ready": "Exportación lista",
};

export const notificationChannelLabels: Record<string, string> = {
  in_app: "En la aplicación",
  email: "Correo",
  push: "Push",
  whatsapp: "WhatsApp",
  sms: "SMS",
};

/**
 * Whether an event reaches the user through a channel: their choice for the
 * event, else their choice for every event (`*`), else the channel default.
 */
export function preferenceEnabled(
  preferences: NotificationPreference[],
  defaults: Record<string, boolean>,
  event: string,
  channel: string,
): boolean {
  const find = (name: string) =>
    preferences.find((row) => row.event === name && row.channel === channel);
  return (find(event) ?? find("*"))?.enabled ?? defaults[channel] ?? false;
}
