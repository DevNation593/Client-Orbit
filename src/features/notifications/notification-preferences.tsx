"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { hasPermission } from "@/components/common/can";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/error";
import { crmApi } from "@/lib/api/resources";
import { useAuthStore } from "@/lib/auth-store";
import {
  notificationChannelLabels,
  notificationEventLabels,
  preferenceEnabled,
} from "./notifications";

const queryKey = ["notification-preferences"] as const;

export function NotificationPreferences() {
  const user = useAuthStore((state) => state.user);
  const can = (permission: string) =>
    !!user &&
    hasPermission(permission, user.permissions, user.is_platform_admin);
  if (!can("notifications.view")) return null;
  return <PreferenceTable canManage={can("notifications.manage")} />;
}

function PreferenceTable({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const set = useQuery({
    queryKey,
    queryFn: crmApi.notifications.preferences,
  });
  const save = useMutation({
    mutationFn: crmApi.notifications.updatePreferences,
    onSuccess: (saved) => queryClient.setQueryData(queryKey, saved),
    onError: (reason) =>
      setError(
        reason instanceof ApiError
          ? reason.message
          : "No se pudo guardar la preferencia.",
      ),
  });
  const { preferences = [], events = [], defaults = {} } = set.data ?? {};
  // Channels the API cannot deliver through yet are not offered.
  const channels = (set.data?.channels ?? [])
    .filter((channel) => channel.operational)
    .map((channel) => channel.key);
  const channelLabel = (channel: string) =>
    notificationChannelLabels[channel] ?? channel;

  return (
    <Card id="notificaciones">
      <CardHeader>
        <div>
          <CardTitle>Notificaciones</CardTitle>
          <p className="text-muted mt-1 text-xs">
            Elige qué avisos recibes y por dónde. Se aplican a todos tus
            espacios.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {set.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : set.isError ? (
          <p className="text-danger text-sm">
            No se pudieron cargar tus preferencias.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted text-xs tracking-wide uppercase">
                <tr>
                  <th className="py-2 pr-4 font-bold">Evento</th>
                  {channels.map((channel) => (
                    <th
                      className="px-4 py-2 text-center font-bold"
                      key={channel}
                    >
                      {channelLabel(channel)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {events.map((event) => {
                  const eventLabel = notificationEventLabels[event] ?? event;
                  return (
                    <tr key={event}>
                      <td className="py-3 pr-4 font-semibold">{eventLabel}</td>
                      {channels.map((channel) => {
                        const existing = preferences.find(
                          (row) =>
                            row.event === event && row.channel === channel,
                        );
                        return (
                          <td className="px-4 py-3 text-center" key={channel}>
                            <input
                              aria-label={
                                eventLabel +
                                ": " +
                                channelLabel(channel).toLowerCase()
                              }
                              checked={preferenceEnabled(
                                preferences,
                                defaults,
                                event,
                                channel,
                              )}
                              className="h-4 w-4"
                              disabled={!canManage || save.isPending}
                              onChange={(change) => {
                                setError(null);
                                save.mutate([
                                  {
                                    event,
                                    channel,
                                    enabled: change.target.checked,
                                    // Omitting it would reset a digest to immediate.
                                    ...(existing &&
                                    existing.delivery !== "immediate"
                                      ? { delivery: existing.delivery }
                                      : {}),
                                  },
                                ]);
                              }}
                              type="checkbox"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {error ? (
          <p className="text-danger mt-3 text-sm font-medium" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
