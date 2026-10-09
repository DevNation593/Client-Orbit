"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { titleCase } from "@/lib/utils";

const labels: Record<string, string> = {
  contacts: "Contactos",
  organizations: "Organizaciones",
  leads: "Leads",
  deals: "Oportunidades",
  tasks: "Tareas",
  pipelines: "Pipelines",
  entities: "Entidades",
  relations: "Relaciones",
  files: "Archivos",
  activities: "Actividad",
  reports: "Reportes",
  settings: "Configuración",
  organization: "Organización",
  team: "Equipo",
  fields: "Campos personalizados",
  integrations: "Integraciones",
  audit: "Auditoría",
  data: "Datos",
  automations: "Automatizaciones",
  profile: "Mi perfil",
  new: "Nuevo",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const items = segments.map((segment, index) => ({
    label: /^\d+$/.test(segment)
      ? "Detalle"
      : (labels[segment] ?? titleCase(segment)),
    href: "/" + segments.slice(0, index + 1).join("/"),
  }));

  return (
    <nav
      aria-label="Migas de pan"
      className="text-muted mb-3 flex min-w-0 items-center gap-1.5 overflow-x-auto text-xs"
    >
      <Link
        aria-label="Ir al resumen"
        className="hover:text-foreground inline-flex shrink-0 items-center gap-1"
        href="/"
      >
        <Home size={13} />
        Inicio
      </Link>
      {items.map((item, index) => (
        <span
          className="inline-flex shrink-0 items-center gap-1.5"
          key={item.href}
        >
          <ChevronRight size={13} />
          {index === items.length - 1 ? (
            <span aria-current="page" className="text-foreground font-semibold">
              {item.label}
            </span>
          ) : (
            <Link className="hover:text-foreground" href={item.href}>
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
