import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "border-border text-foreground focus:border-ring focus:ring-ring/10 h-10 w-full appearance-none rounded-xl border bg-white px-3 text-sm shadow-sm outline-none focus:ring-4",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
