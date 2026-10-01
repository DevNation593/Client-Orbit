"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ContactRound,
  MoreHorizontal,
  Plus,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { useContacts, useDeals, useLeads, useTasks } from "@/hooks/use-crm";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { Avatar } from "@/components/common/avatar";
import { ErrorState } from "@/components/common/async-state";
import { Can } from "@/components/common/can";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const contacts = useContacts({
    page: 1,
    per_page: 8,
    sort: "created_at",
    direction: "desc",
  });
  const leads = useLeads({
    page: 1,
    per_page: 8,
    sort: "created_at",
    direction: "desc",
  });
  const deals = useDeals({
    page: 1,
    per_page: 8,
    sort: "created_at",
    direction: "desc",
  });
  const tasks = useTasks({
    page: 1,
    per_page: 8,
    sort: "due_at",
    direction: "asc",
  });
  const hasError =
    contacts.isError || leads.isError || deals.isError || tasks.isError;
  const loading =
    contacts.isLoading || leads.isLoading || deals.isLoading || tasks.isLoading;
  const pipelineValue = useMemo(
    () =>
      deals.data?.items.reduce(
        (total, deal) => total + Number(deal.value),
        0,
      ) ?? 0,
    [deals.data?.items],
  );
  const openTasks =
    tasks.data?.items.filter(
      (task) => task.status !== "completed" && task.status !== "cancelled",
    ) ?? [];

  if (hasError && !contacts.data && !leads.data && !deals.data && !tasks.data)
    return (
      <ErrorState
        onRetry={() => {
          void contacts.refetch();
          void leads.refetch();
          void deals.refetch();
          void tasks.refetch();
        }}
      />
    );
  return (
    <>
      <PageHeader
        eyebrow="Resumen ejecutivo"
        title="Buenos días, aquí está tu panorama"
        description="Una vista rápida del rendimiento y las prioridades de tu organización."
        action={
          <Can permission="contacts.create">
            <Link
              className="bg-brand hover:bg-brand-strong inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm"
              href="/contacts/new"
            >
              <Plus size={16} />
              Crear contacto
            </Link>
          </Can>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Contactos"
          value={contacts.data?.meta.total ?? 0}
          detail="en tu base activa"
          icon={<ContactRound size={20} />}
          tone="purple"
          loading={loading}
        />
        <KpiCard
          label="Leads activos"
          value={leads.data?.meta.total ?? 0}
          detail="por trabajar"
          icon={<UsersRound size={20} />}
          tone="blue"
          loading={loading}
        />
        <KpiCard
          label="Valor en pipeline"
          value={formatCurrency(pipelineValue)}
          detail="muestra actual"
          icon={<BriefcaseBusiness size={20} />}
          tone="orange"
          loading={loading}
        />
        <KpiCard
          label="Tareas abiertas"
          value={openTasks.length}
          detail="requieren seguimiento"
          icon={<CheckCircle2 size={20} />}
          tone="green"
          loading={loading}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Actividad comercial</CardTitle>
              <p className="text-muted mt-1 text-xs">
                Distribución de los registros recientes
              </p>
            </div>
            <Button aria-label="Más opciones" size="icon" variant="ghost">
              <MoreHorizontal size={18} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border-border flex h-52 items-end gap-2 border-b border-l px-4 pt-6 pb-0 sm:gap-4">
              {[36, 52, 42, 70, 56, 86, 64, 78, 62, 92, 74, 88].map(
                (height, index) => (
                  <div
                    className="group flex h-full flex-1 flex-col justify-end"
                    key={index}
                  >
                    <div
                      className="bg-brand/80 group-hover:bg-brand relative rounded-t-lg transition-all"
                      style={{ height: `${height}%` }}
                    >
                      <span className="text-brand absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[10px] font-bold group-hover:block">
                        {height}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
            <div className="text-muted mt-4 flex items-center justify-between text-xs">
              <span>Hace 12 semanas</span>
              <span>Semana actual</span>
            </div>
            <div className="text-muted mt-5 flex flex-wrap gap-5 text-xs">
              <span className="inline-flex items-center gap-2">
                <i className="bg-brand h-2 w-2 rounded-full" />
                Registros creados
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="h-2 w-2 rounded-full bg-[#c5c8ff]" />
                Conversión estimada
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Prioridades</CardTitle>
              <p className="text-muted mt-1 text-xs">
                Tareas que necesitan atención
              </p>
            </div>
            <Link className="text-brand text-xs font-bold" href="/tasks">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {openTasks.length ? (
              openTasks.slice(0, 5).map((task) => (
                <Link
                  className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-2.5 transition-colors"
                  href="/tasks"
                  key={task.id}
                >
                  <span className="text-warning flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <CheckCircle2 size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {task.title}
                    </span>
                    <span className="text-muted mt-0.5 block text-xs">
                      {formatRelativeDate(task.due_at)}
                    </span>
                  </span>
                  <StatusBadge value={task.priority} />
                </Link>
              ))
            ) : (
              <div className="text-muted py-8 text-center text-sm">
                No tienes tareas pendientes.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Contactos recientes</CardTitle>
              <p className="text-muted mt-1 text-xs">
                Últimos registros agregados
              </p>
            </div>
            <Link
              className="text-brand inline-flex items-center gap-1 text-xs font-bold"
              href="/contacts"
            >
              Ver todos <ArrowUpRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {contacts.data?.items.length ? (
              contacts.data.items.slice(0, 5).map((contact) => (
                <Link
                  className="hover:bg-surface-subtle flex items-center gap-3 rounded-xl p-2.5"
                  href={`/contacts/${contact.id}`}
                  key={contact.id}
                >
                  <Avatar
                    name={`${contact.first_name} ${contact.last_name ?? ""}`}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {contact.first_name} {contact.last_name}
                    </span>
                    <span className="text-muted block truncate text-xs">
                      {contact.email ?? "Sin correo"}
                    </span>
                  </span>
                  <span className="text-muted text-xs">
                    {formatRelativeDate(contact.created_at)}
                  </span>
                </Link>
              ))
            ) : (
              <div className="text-muted py-8 text-center text-sm">
                Todavía no hay contactos.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Oportunidades</CardTitle>
              <p className="text-muted mt-1 text-xs">Negocios de mayor valor</p>
            </div>
            <Link className="text-brand text-xs font-bold" href="/deals">
              Pipeline
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {deals.data?.items.length ? (
              deals.data.items.slice(0, 4).map((deal) => (
                <div className="flex items-center gap-3" key={deal.id}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <TrendingUp size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {deal.name}
                    </p>
                    <p className="text-muted mt-0.5 text-xs">
                      {deal.stage?.name ?? "Sin etapa"}
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(deal.value, deal.currency)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-muted py-8 text-center text-sm">
                Aún no hay oportunidades.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  tone: "purple" | "blue" | "orange" | "green";
  loading: boolean;
}) {
  const tones = {
    purple: "bg-brand-soft text-brand",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-success",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
          >
            {icon}
          </span>
          <span className="text-success inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold">
            <TrendingUp size={11} />
            +8.2%
          </span>
        </div>
        <p className="text-muted mt-5 text-sm font-semibold">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">
          {loading ? "—" : value}
        </p>
        <p className="text-muted mt-1 text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}
