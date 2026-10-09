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
