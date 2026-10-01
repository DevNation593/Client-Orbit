"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckSquare,
  FileText,
  Link2,
} from "lucide-react";
import type {
  Contact,
  Deal,
  FileRecord,
  OrganizationReference,
  Relation,
  Task,
} from "@/types/domain";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Customer360Props {
  contact: Contact;
  organizations: OrganizationReference[];
  deals: Deal[];
  tasks: Task[];
  relations: Relation[];
  files: FileRecord[];
  dealsLoading?: boolean;
  tasksLoading?: boolean;
  relationsLoading?: boolean;
  filesLoading?: boolean;
}

export function Customer360Panels({
  contact,
  organizations,
  deals,
  tasks,
  relations,
  files,
  dealsLoading = false,
  tasksLoading = false,
  relationsLoading = false,
  filesLoading = false,
}: Customer360Props) {
  return (
    <section aria-label="Customer 360" className="mt-6 space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Oportunidades</CardTitle>
                <p className="text-muted mt-1 text-xs">
                  Negocios vinculados directamente a este contacto
                </p>
              </div>
              <BriefcaseBusiness className="text-brand" size={19} />
            </div>
          </CardHeader>
          <CardContent>
            <CollectionState loading={dealsLoading} empty={!deals.length}>
              <div className="space-y-2">
                {deals.map((deal) => (
                  <Link
                    className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-3"
                    href={"/deals/" + deal.id}
                    key={deal.id}
                  >
                    <span className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <BriefcaseBusiness size={16} />
                    </span>
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
                ))}
              </div>
            </CollectionState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Tareas</CardTitle>
                <p className="text-muted mt-1 text-xs">
                  Seguimientos pendientes del contacto
                </p>
              </div>
              <CheckSquare className="text-brand" size={19} />
            </div>
          </CardHeader>
          <CardContent>
            <CollectionState loading={tasksLoading} empty={!tasks.length}>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Link
                    className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-3"
                    href={"/tasks/" + task.id}
                    key={task.id}
                  >
                    <span className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <CheckSquare size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {task.title}
                      </span>
                      <span className="text-muted mt-0.5 block text-xs">
                        {formatDate(task.due_at)} ·{" "}
                        {titleCase(task.priority)}
                      </span>
                    </span>
                    <StatusBadge value={task.status} />
                  </Link>
                ))}
              </div>
            </CollectionState>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Relaciones</CardTitle>
                <p className="text-muted mt-1 text-xs">
                  Registros relacionados desde cualquier módulo
                </p>
              </div>
              <Link2 className="text-brand" size={19} />
            </div>
          </CardHeader>
          <CardContent>
            <CollectionState loading={relationsLoading} empty={!relations.length}>
              <div className="space-y-2">
                {relations.map((relation) => {
                  const record = relationRecord(
                    relation,
                    contact,
                    organizations,
                    deals,
                  );
                  return (
                    <div
                      className="flex items-center gap-3 rounded-xl p-3"
                      key={relation.id}
                    >
                      <span className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <Link2 size={16} />
                      </span>
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
                })}
              </div>
            </CollectionState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Archivos</CardTitle>
                <p className="text-muted mt-1 text-xs">
                  Documentos asociados a este contacto
                </p>
              </div>
              <FileText className="text-brand" size={19} />
            </div>
          </CardHeader>
          <CardContent>
            <CollectionState loading={filesLoading} empty={!files.length}>
              <div className="space-y-2">
                {files.map((file) => (
                  <a
                    className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-3"
                    href={"/api/backend/files/" + file.id + "/download"}
                    key={file.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <FileText size={16} />
                    </span>
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
                ))}
              </div>
            </CollectionState>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CollectionState({
  loading,
  empty,
  children,
}: {
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <div className="space-y-2">
        <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  if (empty)
    return (
      <p className="text-muted border-border rounded-xl border border-dashed p-6 text-center text-sm">
        No hay registros asociados todavía.
      </p>
    );
  return <>{children}</>;
}

function relationRecord(
  relation: Relation,
  contact: Contact,
  organizations: OrganizationReference[],
  deals: Deal[],
) {
  const sourceIsContact =
    isEntityType(relation.from_type, "contact") &&
    relation.from_id === String(contact.id);
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
    label = deals.find((deal) => deal.id === numericId)?.name ?? "Oportunidad #" + id;
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
