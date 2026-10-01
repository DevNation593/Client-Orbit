import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-brand-strong inline-flex shrink-0 items-center justify-center rounded-full bg-[#e4e6ff] font-bold",
        size === "sm"
          ? "h-7 w-7 text-[10px]"
          : size === "lg"
            ? "h-12 w-12 text-sm"
            : "h-9 w-9 text-xs",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
