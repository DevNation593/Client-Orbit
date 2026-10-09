"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckSquare,
  FileText,
  Link2,
  type LucideIcon,
} from "lucide-react";
import type {
  CustomerOverview,
  OverviewModule,
} from "@/features/customer360/overview";
import type {
  Contact,
  Deal,
  OrganizationReference,
  Relation,
} from "@/types/domain";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Customer360Props {
  contact: Contact;
  /** Modules of the contact overview; absent ones are not visible to the user. */
  modules: CustomerOverview["modules"] | undefined;
  loading?: boolean;
}

export function Customer360Panels({
  contact,
  modules,
  loading = false,
}: Customer360Props) {
  const organizations = modules?.companies?.items ?? [];
  const deals = modules?.opportunities;
  const tasks = modules?.tasks;
  const relations = modules?.relationships;
  const files = modules?.documents;

  return (
    <section aria-label="Customer 360" className="mt-6 space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleCard
          description="Negocios del contacto y de sus organizaciones"
          icon={BriefcaseBusiness}
          loading={loading}
          module={deals}
          title="Oportunidades"
        >
          {(items) =>
            items.map((deal) => (
              <Link
                className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-3"
                href={"/deals/" + deal.id}
                key={deal.id}
              >
                <RowIcon icon={BriefcaseBusiness} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {deal.name}
                  </span>
                  <span className="text-muted mt-0.5 block text-xs">
                    {deal.stage?.name ?? "Sin etapa"} ·{" "}
                    {formatCurrency(deal.value, deal.currency)}
                  </span>
                </span>
                <ArrowUpRight className="text-muted" size={15} />
              </Link>
            ))
          }
        </ModuleCard>

        <ModuleCard
          description="Seguimientos del contacto y de sus registros"
          icon={CheckSquare}
          loading={loading}
          module={tasks}
          title="Tareas"
        >
          {(items) =>
            items.map((task) => (
              <Link
                className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-3"
                href={"/tasks/" + task.id}
                key={task.id}
              >
                <RowIcon icon={CheckSquare} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {task.title}
                  </span>
                  <span className="text-muted mt-0.5 block text-xs">
                    {formatDate(task.due_at)} · {titleCase(task.priority)}
                  </span>
                </span>
                <StatusBadge value={task.status} />
              </Link>
            ))
          }
        </ModuleCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ModuleCard
          description="Registros relacionados desde cualquier módulo"
          icon={Link2}
          loading={loading}
          module={relations}
          title="Relaciones"
        >
          {(items) =>
            items.map((relation) => {
              const record = relationRecord(
                relation,
                contact,
                organizations,
                deals?.items ?? [],
              );
              return (
                <div
                  className="flex items-center gap-3 rounded-xl p-3"
                  key={relation.id}
                >
                  <RowIcon icon={Link2} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {record.label}
                    </span>
                    <span className="text-muted mt-0.5 block text-xs">
                      {titleCase(relation.relation_type)}
                    </span>
                  </span>
                  {record.href ? (
                    <Link
                      aria-label={"Abrir " + record.label}
                      className="text-brand"
                      href={record.href}
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                  ) : (
                    <span className="text-muted text-xs">
                      {record.type} #{record.id}
                    </span>
                  )}
                </div>
              );
            })
          }
        </ModuleCard>

        <ModuleCard
          description="Documentos del contacto y de sus registros"
          icon={FileText}
          loading={loading}
          module={files}
          title="Archivos"
        >
          {(items) =>
            items.map((file) => (
              <a
                className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-3"
                href={"/api/backend/files/" + file.id + "/download"}
                key={file.id}
                rel="noreferrer"
                target="_blank"
              >
                <RowIcon icon={FileText} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {file.filename}
                  </span>
                  <span className="text-muted mt-0.5 block text-xs">
                    {formatFileSize(file.size)} · {formatDate(file.created_at)}
                  </span>
                </span>
                <ArrowUpRight className="text-muted" size={15} />
              </a>
            ))
          }
        </ModuleCard>
      </div>
    </section>
  );
}

function ModuleCard<T>({
  title,
  description,
  icon: Icon,
  module,
  loading,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  module: OverviewModule<T> | undefined;
  loading: boolean;
  children: (items: T[]) => React.ReactNode;
}) {
  // The API omits a module when the user lacks its permission.
  if (!loading && !module) return null;
  const items = module?.items ?? [];
  const total = module?.count ?? 0;

  return (
    <Card aria-label={title} role="region">
      <CardHeader>
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-muted mt-1 text-xs">{description}</p>
          </div>
          <Icon className="text-brand" size={19} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : !items.length ? (
          <p className="text-muted border-border rounded-xl border border-dashed p-6 text-center text-sm">
            No hay registros asociados todavía.
          </p>
        ) : (
          <>
            <div className="space-y-2">{children(items)}</div>
            {total > items.length ? (
              <p className="text-muted mt-3 text-center text-xs">
                Mostrando {items.length} de {total}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
      <Icon size={16} />
    </span>
  );
}

function relationRecord(
  relation: Relation,
  contact: Contact,
  organizations: OrganizationReference[],
  deals: Deal[],
) {
  const sourceIsContact =
    isEntityType(relation.from_type, "contact") &&
    String(relation.from_id) === String(contact.id);
  const type = sourceIsContact ? relation.to_type : relation.from_type;
  const id = sourceIsContact ? relation.to_id : relation.from_id;
  const normalizedType = normalizeEntityType(type);
  const numericId = Number(id);
  let label = titleCase(normalizedType) + " #" + id;
  let href: string | undefined;

  if (normalizedType === "contact") {
    label =
      contact.id === numericId
        ? (contact.first_name + " " + (contact.last_name ?? "")).trim()
        : "Contacto #" + id;
    href = "/contacts/" + id;
  } else if (normalizedType === "organization") {
    label =
      organizations.find((organization) => organization.id === numericId)
        ?.name ?? "Organización #" + id;
    href = "/organizations/" + id;
  } else if (normalizedType === "deal") {
    label =
      deals.find((deal) => deal.id === numericId)?.name ?? "Oportunidad #" + id;
    href = "/deals/" + id;
  } else if (normalizedType === "lead") {
    label = "Lead #" + id;
    href = "/leads/" + id;
  }

  return { type: normalizedType, id, label, href };
}

function normalizeEntityType(type: string) {
  const normalized = type.toLowerCase().replaceAll("\\", "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? normalized;
}

function isEntityType(type: string, expected: string) {
  const normalized = normalizeEntityType(type);
  return normalized === expected || normalized === expected + "s";
}

function formatFileSize(size?: number) {
  if (!size) return "Tamaño desconocido";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
}
