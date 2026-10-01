"use client";

import Link from "next/link";
import { Bell, Check, Inbox } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  href?: string;
  read?: boolean;
}

export function NotificationCenter({
  initialNotifications = [],
}: {
  initialNotifications?: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const unread = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const markAllRead = () =>
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
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
                  onClick={markAllRead}
                  type="button"
                >
                  <Check className="mr-1 inline" size={13} />
                  Marcar todas
                </button>
              ) : null}
            </div>
            {notifications.length ? (
              <div className="mt-2 space-y-1">
                {notifications.map((notification) => {
                  const content = (
                    <div
                      className={`rounded-xl p-3 ${notification.read ? "" : "bg-brand-soft/60"}`}
                    >
                      <p className="text-sm font-semibold">
                        {notification.title}
                      </p>
                      <p className="text-muted mt-1 text-xs">
                        {notification.description}
                      </p>
                    </div>
                  );
                  return notification.href ? (
                    <Link
                      href={notification.href}
                      key={notification.id}
                      onClick={() => setOpen(false)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      className="w-full text-left"
                      key={notification.id}
                      onClick={() =>
                        setNotifications((current) =>
                          current.map((entry) =>
                            entry.id === notification.id
                              ? { ...entry, read: true }
                              : entry,
                          ),
                        )
                      }
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
                <p className="text-muted mt-1 text-xs">
                  El centro está preparado para eventos realtime del backend.
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
