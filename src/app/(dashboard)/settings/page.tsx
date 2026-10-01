"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ArrowUpDown,
  Bot,
  Building2,
  Database,
  FileSliders,
  GitBranch,
  Plug,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Can } from "@/components/common/can";

const sections = [
  {
    title: "Organización",
    description: "Branding, información y preferencias del espacio.",
    href: "/settings/organization",
    icon: Building2,
    permission: "settings.manage",
    tone: "bg-blue-50 text-blue-600",
  },
  {
    title: "Equipo y roles",
    description: "Usuarios, roles y permisos de acceso.",
    href: "/settings/team",
    icon: UsersRound,
    permission: "users.manage",
    tone: "bg-emerald-50 text-success",
  },
  {
    title: "Campos personalizados",
    description: "Adapta formularios para cada proceso.",
    href: "/settings/fields",
    icon: FileSliders,
    permission: "custom_fields.manage",
    tone: "bg-brand-soft text-brand",
  },
  {
    title: "Entidades dinámicas",
    description: "Crea módulos propios para tu industria.",
    href: "/entities",
    icon: Database,
    permission: "custom_entities.manage",
    tone: "bg-violet-50 text-violet-600",
  },
  {
    title: "Pipelines",
    description: "Define etapas y probabilidades de negocio.",
    href: "/pipelines",
    icon: GitBranch,
    permission: "pipelines.manage",
    tone: "bg-orange-50 text-orange-600",
  },
  {
    title: "Automatizaciones",
    description: "Diseña reglas declarativas para el backend.",
    href: "/settings/automations",
    icon: Bot,
    permission: "automations.manage",
    tone: "bg-pink-50 text-pink-600",
  },
  {
    title: "Integraciones",
    description: "Conecta herramientas externas sin exponer secretos.",
    href: "/settings/integrations",
    icon: Plug,
    permission: "integrations.manage",
    tone: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "Auditoría",
    description: "Consulta cambios relevantes del espacio.",
    href: "/settings/audit",
    icon: ShieldCheck,
    permission: "audit.view",
    tone: "bg-slate-100 text-slate-600",
  },
  {
    title: "Importar y exportar",
    description: "Mueve datos con validación y procesamiento asíncrono.",
    href: "/settings/data",
    icon: ArrowUpDown,
    permission: "imports.create",
    tone: "bg-indigo-50 text-indigo-600",
  },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Configuración"
        description="Configura tu espacio sin duplicar código por industria."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Can
              fallback={null}
              key={section.href}
              permission={section.permission}
            >
              <Link href={section.href}>
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-5">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${section.tone}`}
                    >
                      <Icon size={21} />
                    </span>
                    <div className="mt-5 flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold">{section.title}</h2>
                        <p className="text-muted mt-1 text-sm leading-5">
                          {section.description}
                        </p>
                      </div>
                      <ArrowUpRight className="text-muted shrink-0" size={17} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </Can>
          );
        })}
      </div>
    </>
  );
}
