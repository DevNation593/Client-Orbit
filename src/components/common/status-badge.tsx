import { Badge, type BadgeProps } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

const positive = new Set(["active", "completed", "won", "converted", "open"]);
const warning = new Set([
  "pending",
  "in_progress",
  "proposal",
  "contacted",
  "paused",
]);
const negative = new Set([
  "cancelled",
  "lost",
  "inactive",
  "failed",
  "suspended",
]);

export function StatusBadge({
  value,
  label,
  ...props
}: { value?: string | null; label?: string } & Omit<BadgeProps, "children">) {
  const normalized = value?.toLowerCase() ?? "unknown";
  const variant = positive.has(normalized)
    ? "success"
    : warning.has(normalized)
      ? "warning"
      : negative.has(normalized)
        ? "danger"
        : "neutral";
  return (
    <Badge variant={variant} {...props}>
      {label ?? titleCase(value ?? "Sin estado")}
    </Badge>
  );
}
