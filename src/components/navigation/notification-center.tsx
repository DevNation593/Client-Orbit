"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bell, Check, Inbox } from "lucide-react";
import { useState } from "react";
import { hasPermission } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import {
  notificationHref,
  type ApiNotification,
} from "@/features/notifications/notifications";
import { crmApi } from "@/lib/api/resources";
import { useAuthStore } from "@/lib/auth-store";
import { formatRelativeDate } from "@/lib/utils";

const queryKey = ["notifications"] as const;
// Until the realtime channel is wired, the badge is refreshed on a timer.
const UNREAD_REFRESH_MS = 60_000;

export function NotificationCenter() {
  const user = useAuthStore((state) => state.user);
  const allowed =
    !!user &&
    hasPermission(
      "notifications.view",
      user.permissions,
      user.is_platform_admin,
    );
  return allowed ? <NotificationPanel /> : null;
}

function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const unreadCount = useQuery({
    queryKey: [...queryKey, "unread-count"],
    queryFn: crmApi.notifications.unreadCount,
    refetchInterval: UNREAD_REFRESH_MS,
  });
  const list = useQuery({
    queryKey: [...queryKey, "recent"],
    queryFn: () => crmApi.notifications.list({ per_page: 10 }),
    enabled: open,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const markRead = useMutation({
    mutationFn: crmApi.notifications.markRead,
    onSuccess: refresh,
  });
  const markAllRead = useMutation({
    mutationFn: crmApi.notifications.markAllRead,
    onSuccess: refresh,
  });
  const unread = unreadCount.data?.count ?? 0;
  const notifications = list.data?.items ?? [];

  const openNotification = (notification: ApiNotification) => {
    if (!notification.read_at) markRead.mutate(notification.id);
  };

  return (
    <div className="relative">
      <Button
        aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}
        className="relative"
        size="icon"
        variant="ghost"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={19} />
        {unread ? (
          <span className="bg-brand absolute top-2 right-2 flex h-1.5 min-w-1.5 rounded-full" />
        ) : null}
      </Button>
      {open ? (
        <>
          <button
            aria-label="Cerrar notificaciones"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section className="border-border absolute top-12 right-0 z-30 w-[min(360px,calc(100vw-2rem))] rounded-2xl border bg-white p-3 shadow-xl">
            <div className="flex items-center justify-between px-2 py-1">
              <div>
                <h2 className="font-bold">Notificaciones</h2>
                <p className="text-muted text-xs">
                  {unread ? `${unread} sin leer` : "Todo al día"}
                </p>
              </div>
              {unread ? (
                <button
                  className="text-brand text-xs font-bold"
                  disabled={markAllRead.isPending}
                  onClick={() => markAllRead.mutate()}
                  type="button"
                >
                  <Check className="mr-1 inline" size={13} />
                  Marcar todas
                </button>
              ) : null}
            </div>
            {list.isError ? (
              <p className="text-danger flex items-center gap-2 p-3 text-xs">
                <AlertCircle size={15} />
                No se pudieron cargar las notificaciones.
              </p>
            ) : list.isLoading ? (
              <div className="mt-2 space-y-2">
                <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : notifications.length ? (
              <div className="mt-2 max-h-[min(60vh,420px)] space-y-1 overflow-y-auto">
                {notifications.map((notification) => {
                  const href = notificationHref(
                    notification,
                    window.location.origin,
                  );
                  const content = (
                    <div
                      className={`rounded-xl p-3 ${notification.read_at ? "" : "bg-brand-soft/60"}`}
                    >
                      <p className="text-sm font-semibold">
                        {notification.title}
                      </p>
                      {notification.body ? (
                        <p className="text-muted mt-1 text-xs">
                          {notification.body}
                        </p>
                      ) : null}
                      <p className="text-muted mt-1 text-[11px]">
                        {formatRelativeDate(notification.created_at)}
                      </p>
                    </div>
                  );
                  return href ? (
                    <Link
                      className="block"
                      href={href}
                      key={notification.id}
                      onClick={() => {
                        openNotification(notification);
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      className="block w-full text-left"
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      type="button"
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <Inbox className="text-muted" size={24} />
                <p className="mt-2 text-sm font-semibold">
                  No hay notificaciones
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
