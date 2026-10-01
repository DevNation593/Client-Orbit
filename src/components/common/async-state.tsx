import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton className="h-14 w-full" key={index} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border bg-surface-subtle flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center">
      <div className="bg-brand-soft text-brand mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
        <Inbox size={22} />
      </div>
      <h3 className="text-foreground font-bold">{title}</h3>
      <p className="text-muted mt-1 max-w-sm text-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "No se pudo cargar la información.",
  description = "Revisa tu conexión e inténtalo de nuevo.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/50 px-6 py-14 text-center">
      <AlertCircle className="text-danger mb-3" size={24} />
      <h3 className="text-foreground font-bold">{title}</h3>
      <p className="text-muted mt-1 max-w-sm text-sm">{description}</p>
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export function ForbiddenState({
  description = "Tu rol no tiene permisos para acceder a este recurso.",
}: {
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-100 bg-amber-50/60 px-6 py-14 text-center">
      <AlertCircle className="text-warning mb-3" size={24} />
      <h3 className="text-foreground font-bold">Acceso restringido</h3>
      <p className="text-muted mt-1 max-w-sm text-sm">{description}</p>
    </div>
  );
}
