/**
 * Sections of the app that a deployment can switch on one at a time. The key
 * is also the first segment of every route of the module.
 *
 * This is a deployment setting, not a tenant one: per-tenant modules and plan
 * limits need `GET /tenant/features`, which the API does not offer yet.
 */
export const MODULES = [
  "contacts",
  "organizations",
  "leads",
  "deals",
  "tasks",
  "pipelines",
  "entities",
  "relations",
  "files",
  "activities",
  "reports",
] as const;

export type ModuleKey = (typeof MODULES)[number];

/** `NEXT_PUBLIC_ENABLED_MODULES`: a comma separated list; empty means all. */
export function parseEnabledModules(value: string | undefined): Set<ModuleKey> {
  const listed = (value ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  if (!listed.length) return new Set(MODULES);
  return new Set(
    listed.filter((name): name is ModuleKey =>
      (MODULES as readonly string[]).includes(name),
    ),
  );
}

// Read on each call by its full name, the only form Next.js inlines.
function deploymentModules() {
  return parseEnabledModules(process.env.NEXT_PUBLIC_ENABLED_MODULES);
}

/** Whether a route can be opened; routes outside any module always can. */
export function isPathEnabled(
  pathname: string,
  enabled: Set<ModuleKey> = deploymentModules(),
): boolean {
  const segment = pathname.split("/")[1] ?? "";
  if (!(MODULES as readonly string[]).includes(segment)) return true;
  return enabled.has(segment as ModuleKey);
}
