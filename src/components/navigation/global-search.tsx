"use client";

import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  LoaderCircle,
  Search,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { Input } from "@/components/ui/input";

const icons = {
  contact: UserRound,
  organization: Building2,
  lead: UserRound,
  deal: BriefcaseBusiness,
  task: CheckSquare,
};

export function GlobalSearch() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(value, 220);
  const search = useGlobalSearch(debounced);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node))
        setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (value) setOpen(true);
  }, [value]);

  return (
    <div
      className="relative hidden w-[min(400px,40vw)] md:block"
      ref={containerRef}
    >
      <Search className="text-muted absolute top-2.5 left-3" size={17} />
      <Input
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Buscar en el CRM"
        className="h-10 border-transparent bg-white pl-10 shadow-none"
        placeholder="Buscar contactos, negocios…"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => setValue(event.target.value)}
      />
      {open && value ? (
        <div
          className="border-border absolute top-12 right-0 left-0 z-30 max-h-[min(70vh,440px)] overflow-y-auto rounded-2xl border bg-white p-2 shadow-xl"
          role="listbox"
        >
          {debounced.trim().length < 2 ? (
            <p className="text-muted p-3 text-xs">
              Escribe al menos 2 caracteres para buscar registros.
            </p>
          ) : search.isLoading ? (
            <p className="text-muted flex items-center gap-2 p-3 text-xs">
              <LoaderCircle className="animate-spin" size={15} />
              Buscando en tus registros…
            </p>
          ) : search.data?.failed === 5 ? (
            <p className="text-danger flex items-center gap-2 p-3 text-xs">
              <AlertCircle size={15} />
              No se pudo consultar la búsqueda. Intenta nuevamente.
            </p>
          ) : search.data?.groups.length ? (
            search.data.groups.map((group) => {
              const Icon = icons[group.kind];
              return (
                <div key={group.kind}>
                  <p className="text-muted px-2 py-1.5 text-[10px] font-bold tracking-wide uppercase">
                    {group.label}
                  </p>
                  {group.results.map((result) => (
                    <Link
                      className="hover:bg-surface-subtle flex items-center gap-2 rounded-xl px-2.5 py-2"
                      href={result.href}
                      key={result.kind + result.id}
                      onClick={() => {
                        setOpen(false);
                        setValue("");
                      }}
                      role="option"
                    >
                      <Icon className="text-brand" size={16} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {result.label}
                        </span>
                        {result.description ? (
                          <span className="text-muted block truncate text-xs">
                            {result.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  ))}
                </div>
              );
            })
          ) : (
            <p className="text-muted p-3 text-xs">
              No hay registros que coincidan en los módulos autorizados.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
