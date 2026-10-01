"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        aria-label="Cerrar diálogo"
        className="absolute inset-0 cursor-default bg-slate-950/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <section
        aria-labelledby="dialog-title"
        aria-modal="true"
        className={cn(
          "border-border relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-white shadow-2xl",
          className,
        )}
        role="dialog"
      >
        <div className="border-border flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-foreground text-lg font-bold" id="dialog-title">
              {title}
            </h2>
            {description ? (
              <p className="text-muted mt-1 text-sm">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Cerrar"
            className="text-muted hover:text-foreground rounded-lg p-1.5 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
