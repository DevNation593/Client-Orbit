import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "border-border text-foreground placeholder:text-muted/70 focus:border-ring focus:ring-ring/10 h-10 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none focus:ring-4",
        className,
      )}
      {...props}
    />
  );
});
