"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  ContactRound,
  Plus,
  UsersRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { hasPermission } from "@/components/common/can";
import { useAuthStore } from "@/lib/auth-store";
import { isPathEnabled } from "@/lib/modules";
import { Button } from "@/components/ui/button";

const options = [
  {
    label: "Contacto",
    href: "/contacts/new",
    permission: "contacts.create",
    icon: ContactRound,
  },
  {
    label: "Organización",
    href: "/organizations/new",
    permission: "organizations.create",
    icon: Building2,
  },
  {
    label: "Lead",
    href: "/leads/new",
    permission: "leads.create",
    icon: UsersRound,
  },
  {
    label: "Oportunidad",
    href: "/deals/new",
    permission: "deals.create",
    icon: BriefcaseBusiness,
  },
  {
    label: "Tarea",
    href: "/tasks/new",
    permission: "tasks.create",
    icon: CheckSquare,
  },
];

export function QuickCreate() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleOptions = options.filter(
    (option) =>
      isPathEnabled(option.href) &&
      hasPermission(
        option.permission,
        user?.permissions,
        user?.is_platform_admin,
      ),
  );

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  if (!visibleOptions.length) return null;

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        className="hidden sm:inline-flex"
        onClick={() => setOpen((current) => !current)}
      >
        <Plus size={16} />
        Nuevo
      </Button>
      {open ? (
        <div
          aria-label="Crear registro"
          className="border-border absolute top-12 right-0 z-30 w-52 rounded-2xl border bg-white p-2 shadow-xl"
          role="menu"
        >
          <p className="text-muted px-2 py-1.5 text-[10px] font-bold tracking-wide uppercase">
            Crear registro
          </p>
          {visibleOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                className="hover:bg-surface-subtle flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold"
                href={option.href}
                key={option.href}
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <Icon className="text-brand" size={16} />
                {option.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
