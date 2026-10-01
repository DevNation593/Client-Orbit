import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "border-border text-foreground placeholder:text-muted/70 focus:border-ring focus:ring-ring/10 min-h-28 w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-4",
        className,
      )}
      {...props}
    />
  );
});
