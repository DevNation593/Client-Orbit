import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types/api";

export function Pagination({
  meta,
  onPageChange,
}: {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <div className="text-muted mt-4 flex items-center justify-between text-sm">
      <span>
        Mostrando {meta.from ?? 0}–{meta.to ?? 0} de {meta.total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          aria-label="Página anterior"
          disabled={meta.current_page <= 1}
          size="icon"
          variant="secondary"
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-foreground px-2 font-semibold">
          {meta.current_page} / {meta.last_page}
        </span>
        <Button
          aria-label="Página siguiente"
          disabled={meta.current_page >= meta.last_page}
          size="icon"
          variant="secondary"
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
