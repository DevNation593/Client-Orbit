"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  FileCheck2,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Ticket,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { Activity, ActivityType } from "@/types/domain";
import { ApiError } from "@/lib/api/error";
import { formatDate, titleCase } from "@/lib/utils";
import { Avatar } from "./avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const icons: Partial<Record<ActivityType, LucideIcon>> = {
  call: Phone,
  meeting: Video,
  email: Mail,
  whatsapp: MessageCircle,
  note: FileText,
  task: CheckSquare,
  quote: FileCheck2,
  deal: BriefcaseBusiness,
  ticket: Ticket,
  status_change: Sparkles,
  automation: Sparkles,
  system: CalendarDays,
};

const filterOptions = [
  { value: "all", label: "Todo" },
  { value: "messages", label: "Mensajes" },
  { value: "sales", label: "Ventas" },
  { value: "activities", label: "Actividades" },
  { value: "system", label: "Sistema" },
] as const;

export type TimelineFilterValue = (typeof filterOptions)[number]["value"];

export function TimelineFilter({
  value,
  onChange,
}: {
  value: TimelineFilterValue;
  onChange: (value: TimelineFilterValue) => void;
}) {
  return (
    <div
      aria-label="Filtrar timeline"
      className="bg-surface-subtle flex flex-wrap gap-1 rounded-xl p-1"
      role="tablist"
    >
      {filterOptions.map((option) => (
        <button
          aria-selected={value === option.value}
          className={
            "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors " +
            (value === option.value
              ? "bg-white text-brand shadow-sm"
              : "text-muted hover:text-foreground")
          }
          key={option.value}
          onClick={() => onChange(option.value)}
          role="tab"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ActivityTimeline({
  activities,
  loading = false,
  showFilters = true,
}: {
  activities: Activity[];
  loading?: boolean;
  showFilters?: boolean;
}) {
  const [filter, setFilter] = useState<TimelineFilterValue>("all");
  const filteredActivities = activities.filter((activity) =>
    matchesFilter(activity.type, filter),
  );

  if (loading)
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );

  return (
    <div className="space-y-5">
      {showFilters ? (
        <TimelineFilter onChange={setFilter} value={filter} />
      ) : null}
      {!filteredActivities.length ? (
        <div className="border-border text-muted rounded-xl border border-dashed p-6 text-center text-sm">
          {activities.length
            ? "No hay actividad en este filtro."
            : "Aún no hay actividad registrada."}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredActivities.map((activity) => {
            const Icon = icons[activity.type] ?? FileText;
            return (
              <div className="relative flex gap-3" key={activity.id}>
                <div className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      {activity.subject ?? titleCase(activity.type)}
                    </p>
                    <time className="text-muted text-xs">
                      {formatDate(activity.occurred_at ?? activity.created_at)}
                    </time>
                  </div>
                  {activity.body ? (
                    <p className="text-muted mt-1 text-sm leading-6 whitespace-pre-wrap">
                      {activity.body}
                    </p>
                  ) : null}
                  <div className="text-muted mt-2 flex items-center gap-1.5 text-xs">
                    <Avatar name={activity.user?.name} size="sm" />
                    {activity.user?.name ?? "Sistema"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface TimelineComposerValues {
  type: Extract<ActivityType, "call" | "meeting" | "email" | "note">;
  subject: string;
  body: string;
}

export function TimelineComposer({
  onSubmit,
  disabled = false,
}: {
  onSubmit: (values: TimelineComposerValues) => Promise<void>;
  disabled?: boolean;
}) {
  const [form, setForm] = useState<TimelineComposerValues>({
    type: "note",
    subject: "",
    body: "",
  });
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        void onSubmit(form)
          .then(() => setForm({ type: "note", subject: "", body: "" }))
          .catch((reason: unknown) => {
            setError(
              reason instanceof ApiError
                ? reason.message
                : "No se pudo registrar la actividad.",
            );
          });
      }}
    >
      <div>
        <Label htmlFor="timeline-type">Tipo</Label>
        <Select
          id="timeline-type"
          value={form.type}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              type: event.target.value as TimelineComposerValues["type"],
            }))
          }
        >
          <option value="note">Nota</option>
          <option value="call">Llamada</option>
          <option value="meeting">Reunión</option>
          <option value="email">Correo</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="timeline-subject">Asunto</Label>
        <Input
          id="timeline-subject"
          value={form.subject}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              subject: event.target.value,
            }))
          }
        />
      </div>
      <div>
        <Label htmlFor="timeline-body">Detalle</Label>
        <Textarea
          id="timeline-body"
          required
          value={form.body}
          onChange={(event) =>
            setForm((current) => ({ ...current, body: event.target.value }))
          }
        />
      </div>
      {error ? (
        <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button disabled={disabled} type="submit">
          {disabled ? "Guardando…" : "Guardar actividad"}
        </Button>
      </div>
    </form>
  );
}

function matchesFilter(type: ActivityType, filter: TimelineFilterValue) {
  if (filter === "all") return true;
  if (filter === "messages")
    return type === "email" || type === "whatsapp";
  if (filter === "sales") return type === "quote" || type === "deal";
  if (filter === "activities")
    return (
      type === "call" ||
      type === "meeting" ||
      type === "task" ||
      type === "note"
    );
  return (
    type === "status_change" ||
    type === "automation" ||
    type === "system" ||
    type === "ticket"
  );
}
