import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-foreground mb-1.5 block text-sm font-semibold",
        className,
      )}
      {...props}
    />
  );
}
