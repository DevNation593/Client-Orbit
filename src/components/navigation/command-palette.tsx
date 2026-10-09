"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  CheckSquare,
  ContactRound,
  FileText,
  GitBranch,
  Keyboard,
  Search,
  Settings2,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/components/common/can";
import { useAuthStore } from "@/lib/auth-store";
import { isPathEnabled } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CommandGroup = "Navegar" | "Crear";

interface Command {
  id: string;
  label: string;
  description: string;
  href: string;
  group: CommandGroup;
  icon: LucideIcon;
  permission?: string;
}

const commands: Command[] = [
  {
    id: "contacts",
    label: "Abrir contactos",
    description: "Busca y administra personas",
    href: "/contacts",
    group: "Navegar",
    icon: ContactRound,
    permission: "contacts.view",
  },
  {
    id: "organizations",
    label: "Abrir organizaciones",
    description: "Gestiona empresas y cuentas",
    href: "/organizations",
    group: "Navegar",
    icon: UsersRound,
    permission: "organizations.view",
  },
  {
    id: "leads",
    label: "Abrir leads",
    description: "Califica y convierte oportunidades tempranas",
    href: "/leads",
    group: "Navegar",
    icon: UsersRound,
    permission: "leads.view",
  },
  {
    id: "deals",
    label: "Abrir oportunidades",
    description: "Consulta el pipeline comercial",
    href: "/deals",
    group: "Navegar",
    icon: BriefcaseBusiness,
    permission: "deals.view",
  },
  {
    id: "tasks",
    label: "Abrir tareas",
    description: "Organiza seguimientos y vencimientos",
    href: "/tasks",
    group: "Navegar",
    icon: CheckSquare,
    permission: "tasks.view",
  },
  {
    id: "pipelines",
    label: "Abrir pipelines",
    description: "Configura etapas de negocio",
    href: "/pipelines",
    group: "Navegar",
    icon: GitBranch,
    permission: "pipelines.view",
  },
  {
    id: "reports",
    label: "Abrir reportes",
    description: "Consulta indicadores del tenant",
    href: "/reports",
    group: "Navegar",
    icon: BarChart3,
    permission: "reports.view",
  },
  {
    id: "settings",
    label: "Abrir configuración",
    description: "Administra el espacio de trabajo",
    href: "/settings",
    group: "Navegar",
    icon: Settings2,
    permission: "settings.manage",
  },
  {
    id: "activities",
    label: "Registrar actividad",
    description: "Abre el historial de interacciones",
    href: "/activities",
    group: "Navegar",
    icon: FileText,
    permission: "activities.view",
  },
  {
    id: "new-contact",
    label: "Crear contacto",
    description: "Añade una persona al CRM",
    href: "/contacts/new",
    group: "Crear",
    icon: ContactRound,
    permission: "contacts.create",
  },
  {
    id: "new-lead",
    label: "Crear lead",
    description: "Captura un nuevo lead",
    href: "/leads/new",
    group: "Crear",
    icon: UsersRound,
    permission: "leads.create",
  },
  {
    id: "new-deal",
    label: "Crear oportunidad",
    description: "Registra un nuevo negocio",
    href: "/deals/new",
    group: "Crear",
    icon: BriefcaseBusiness,
    permission: "deals.create",
  },
  {
    id: "new-task",
    label: "Crear tarea",
    description: "Programa el siguiente paso",
    href: "/tasks/new",
    group: "Crear",
    icon: CheckSquare,
    permission: "tasks.create",
  },
];

export function CommandPalette() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const availableCommands = useMemo(
    () =>
      commands.filter(
        (command) =>
          isPathEnabled(command.href) &&
          hasPermission(
            command.permission ?? "",
            user?.permissions,
            user?.is_platform_admin,
          ),
      ),
    [user?.is_platform_admin, user?.permissions],
  );
  const filteredCommands = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return availableCommands;
    return availableCommands.filter((command) =>
      (command.label + " " + command.description).toLowerCase().includes(query),
    );
  }, [availableCommands, value]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) =>
          filteredCommands.length ? (current + 1) % filteredCommands.length : 0,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) =>
          filteredCommands.length
            ? (current - 1 + filteredCommands.length) % filteredCommands.length
            : 0,
        );
      } else if (event.key === "Enter") {
        const command = filteredCommands[activeIndex];
        if (command) {
          event.preventDefault();
          router.push(command.href);
          setOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, filteredCommands, open, router]);

  useEffect(() => {
    if (open) {
      setValue("");
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  const close = () => setOpen(false);

  return (
    <>
      <Button
        aria-label="Abrir command palette"
        className="hidden sm:inline-flex"
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        <Keyboard size={16} />
        <span className="hidden md:inline">Comandos</span>
        <kbd className="text-muted hidden rounded border px-1.5 py-0.5 text-[10px] md:inline">
          Ctrl K
        </kbd>
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/25 p-4 pt-[12vh] backdrop-blur-[2px]">
          <button
            aria-label="Cerrar command palette"
            className="absolute inset-0 cursor-default"
            onClick={close}
            type="button"
          />
          <section
            aria-label="Command palette"
            aria-modal="true"
            className="border-border relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border bg-white shadow-2xl"
            role="dialog"
          >
            <div className="border-border flex items-center gap-2 border-b px-4">
              <Search className="text-muted shrink-0" size={18} />
              <Input
                ref={inputRef}
                aria-label="Buscar una acción"
                className="border-0 px-0 shadow-none focus:ring-0"
                placeholder="Busca una acción…"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
              <button
                aria-label="Cerrar"
                className="text-muted hover:text-foreground rounded-lg p-1.5"
                onClick={close}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
            <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              {filteredCommands.length ? (
                (["Navegar", "Crear"] as CommandGroup[]).map((group) => {
                  const groupCommands = filteredCommands.filter(
                    (command) => command.group === group,
                  );
                  if (!groupCommands.length) return null;
                  return (
                    <div key={group}>
                      <p className="text-muted px-2 py-2 text-[10px] font-bold tracking-wide uppercase">
                        {group}
                      </p>
                      {groupCommands.map((command) => {
                        const commandIndex = filteredCommands.indexOf(command);
                        const Icon = command.icon;
                        return (
                          <button
                            className={
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left " +
                              (commandIndex === activeIndex
                                ? "bg-brand-soft"
                                : "hover:bg-surface-subtle")
                            }
                            key={command.id}
                            onClick={() => {
                              router.push(command.href);
                              close();
                            }}
                            type="button"
                          >
                            <span className="bg-brand-soft text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                              <Icon size={16} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">
                                {command.label}
                              </span>
                              <span className="text-muted block truncate text-xs">
                                {command.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <p className="text-muted px-3 py-8 text-center text-sm">
                  No hay acciones disponibles para esta búsqueda.
                </p>
              )}
            </div>
            <div className="border-border text-muted flex items-center gap-3 border-t px-4 py-2 text-[11px]">
              <span>↑↓ navegar</span>
              <span>Enter abrir</span>
              <span>Esc cerrar</span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
