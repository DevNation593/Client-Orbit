"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  ChevronDown,
  CircleUserRound,
  ContactRound,
  Database,
  FileUp,
  Gauge,
  KanbanSquare,
  Link2,
  ListTodo,
  LogOut,
  Settings2,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";

const primaryNavigation = [
  { label: "Resumen", href: "/", icon: Gauge },
  {
    label: "Contactos",
    href: "/contacts",
    icon: ContactRound,
    permission: "contacts.view",
  },
  {
    label: "Organizaciones",
    href: "/organizations",
    icon: Building2,
    permission: "organizations.view",
  },
  {
    label: "Leads",
    href: "/leads",
    icon: UsersRound,
    permission: "leads.view",
  },
  {
    label: "Oportunidades",
    href: "/deals",
    icon: BriefcaseBusiness,
    permission: "deals.view",
  },
  {
    label: "Tareas",
    href: "/tasks",
    icon: CheckSquare,
    permission: "tasks.view",
  },
];

const workspaceNavigation = [
  {
    label: "Pipeline",
    href: "/pipelines",
    icon: KanbanSquare,
    permission: "pipelines.view",
  },
  {
    label: "Entidades",
    href: "/entities",
    icon: Database,
    permission: "custom_entities.view",
  },
  {
    label: "Relaciones",
    href: "/relations",
    icon: Link2,
    permission: "relations.view",
  },
  { label: "Archivos", href: "/files", icon: FileUp, permission: "files.view" },
  {
    label: "Actividad",
    href: "/activities",
    icon: ListTodo,
    permission: "activities.view",
  },
  {
    label: "Reportes",
    href: "/reports",
    icon: BarChart3,
    permission: "reports.view",
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const tenant = useAuthStore((state) => state.tenant);
  const logout = useAuthStore((state) => state.logout);

  return (
    <>
      <button
        aria-label="Cerrar navegación"
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/30 lg:hidden",
          !open && "hidden",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "border-border fixed inset-y-0 left-0 z-40 flex w-[258px] -translate-x-full flex-col border-r bg-white transition-transform lg:static lg:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="border-border flex h-[76px] items-center justify-between border-b px-5">
          <Link
            className="flex items-center gap-2.5"
            href="/"
            onClick={onClose}
          >
            <span className="bg-brand shadow-brand/20 flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black text-white shadow-lg">
              V
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Vantex<span className="text-brand"> CRM</span>
            </span>
          </Link>
          <button
            aria-label="Cerrar menú"
            className="text-muted rounded-lg p-1.5 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 scrollbar-thin overflow-y-auto px-3 py-5">
          <div className="bg-brand-soft mb-5 rounded-2xl p-3">
            <p className="text-brand mb-1 text-[10px] font-bold tracking-[0.15em] uppercase">
              Espacio activo
            </p>
            <p className="text-brand-strong truncate text-sm font-bold">
              {tenant?.name ?? "Tu organización"}
            </p>
            <p className="text-brand/70 mt-0.5 truncate text-xs">
              {tenant?.industry ?? "Multiindustria"}
            </p>
          </div>
          <NavSection
            label="Workspace"
            items={primaryNavigation}
            pathname={pathname}
            onNavigate={onClose}
          />
          <NavSection
            label="Operación"
            items={workspaceNavigation}
            pathname={pathname}
            onNavigate={onClose}
          />
          <div className="mt-7">
            <p className="text-muted mb-2 px-3 text-[10px] font-bold tracking-[0.15em] uppercase">
              Administración
            </p>
            <Can permission="settings.manage">
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  pathname.startsWith("/settings")
                    ? "bg-brand-soft text-brand-strong"
                    : "text-muted hover:text-foreground hover:bg-slate-50",
                )}
                href="/settings"
                onClick={onClose}
              >
                <Settings2 size={18} />
                <span>Configuración</span>
              </Link>
            </Can>
          </div>
        </div>
        <div className="border-border border-t p-3">
          <Link
            className="text-muted hover:text-foreground mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-50"
            href="/profile"
            onClick={onClose}
          >
            <CircleUserRound size={18} />
            <span>Mi perfil</span>
          </Link>
          <Button
            className="text-muted w-full justify-start px-3"
            variant="ghost"
            onClick={() => void logout()}
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </aside>
    </>
  );
}

function NavSection({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: Array<{
    label: string;
    href: string;
    icon: typeof Gauge;
    permission?: string;
  }>;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mb-6">
      <p className="text-muted mb-2 px-3 text-[10px] font-bold tracking-[0.15em] uppercase">
        {label}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const link = (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-brand-soft text-brand-strong"
                  : "text-muted hover:text-foreground hover:bg-slate-50",
              )}
              href={item.href}
              onClick={onNavigate}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {active ? (
                <span className="bg-brand ml-auto h-1.5 w-1.5 rounded-full" />
              ) : null}
            </Link>
          );
          return item.permission ? (
            <Can fallback={null} key={item.href} permission={item.permission}>
              {link}
            </Can>
          ) : (
            <span key={item.href}>{link}</span>
          );
        })}
      </nav>
    </div>
  );
}

export function TenantSwitcher() {
  const tenants = useAuthStore((state) => state.tenants);
  const tenant = useAuthStore((state) => state.tenant);
  const selectTenant = useAuthStore((state) => state.selectTenant);
  if (tenants.length < 2) return null;
  return (
    <div className="relative">
      <select
        aria-label="Seleccionar organización"
        className="border-border text-foreground h-9 max-w-[170px] appearance-none rounded-xl border bg-white py-1 pr-8 pl-3 text-xs font-semibold"
        value={tenant?.id ?? ""}
        onChange={(event) => {
          const next = tenants.find(
            (entry) => entry.id === Number(event.target.value),
          );
          if (next) void selectTenant(next);
        }}
      >
        {tenants.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="text-muted pointer-events-none absolute top-3 right-2.5"
        size={13}
      />
    </div>
  );
}
