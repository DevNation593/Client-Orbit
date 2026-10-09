import { describe, expect, it } from "vitest";
import {
  notificationHref,
  preferenceEnabled,
  type ApiNotification,
} from "./notifications";

const origin = "http://localhost:3000";

function notification(overrides: Partial<ApiNotification>): ApiNotification {
  return {
    id: "0199a1b2-0000-7000-8000-000000000001",
    event: "lead.assigned",
    title: "Nuevo lead asignado",
    body: "Ana Pérez fue asignada a tu cartera.",
    priority: "normal",
    action_url: null,
    context: [],
    read_at: null,
    created_at: "2026-10-09T12:00:00.000000Z",
    ...overrides,
  };
}

describe("notificationHref", () => {
  it("uses a relative action URL as is", () => {
    expect(
      notificationHref(notification({ action_url: "/deals/12" }), origin),
    ).toBe("/deals/12");
  });

  it("turns an absolute URL of this app into an in-app path", () => {
    expect(
      notificationHref(
        notification({ action_url: "http://localhost:3000/tasks/8?tab=notes" }),
        origin,
      ),
    ).toBe("/tasks/8?tab=notes");
  });

  it("never links to another site", () => {
    expect(
      notificationHref(
        notification({ action_url: "https://evil.example/login" }),
        origin,
      ),
    ).toBeUndefined();
    expect(
      notificationHref(
        notification({ action_url: "//evil.example/login" }),
        origin,
      ),
    ).toBeUndefined();
    expect(
      notificationHref(
        notification({ action_url: "javascript:alert(1)" }),
        origin,
      ),
    ).toBeUndefined();
  });

  it.each([
    [{ lead_id: 3 }, "/leads/3"],
    [{ contact_id: 7 }, "/contacts/7"],
    [{ deal_id: 12 }, "/deals/12"],
    [{ task_id: 8 }, "/tasks/8"],
    [{ organization_id: 9 }, "/organizations/9"],
  ])("links to the record named in the context %j", (context, href) => {
    expect(notificationHref(notification({ context }), origin)).toBe(href);
  });

  it("has no link when the notification points to nothing the app can open", () => {
    expect(notificationHref(notification({}), origin)).toBeUndefined();
    expect(
      notificationHref(
        notification({ context: { sequence_id: 4, enrollment_id: 21 } }),
        origin,
      ),
    ).toBeUndefined();
  });

  it("prefers the context over an action URL that leaves the app", () => {
    expect(
      notificationHref(
        notification({
          action_url: "https://evil.example/login",
          context: { lead_id: 3 },
        }),
        origin,
      ),
    ).toBe("/leads/3");
  });
});

describe("preferenceEnabled", () => {
  const defaults = { in_app: true, email: false };
  const row = (event: string, channel: string, enabled: boolean) => ({
    event,
    channel,
    enabled,
    delivery: "immediate" as const,
  });

  it("falls back to the default of the channel", () => {
    expect(preferenceEnabled([], defaults, "lead.assigned", "in_app")).toBe(
      true,
    );
    expect(preferenceEnabled([], defaults, "lead.assigned", "email")).toBe(
      false,
    );
  });

  it("follows what the user chose for the event", () => {
    expect(
      preferenceEnabled(
        [row("lead.assigned", "in_app", false)],
        defaults,
        "lead.assigned",
        "in_app",
      ),
    ).toBe(false);
  });

  it("applies a choice made for every event unless the event has its own", () => {
    const preferences = [
      row("*", "email", true),
      row("task.overdue", "email", false),
    ];

    expect(
      preferenceEnabled(preferences, defaults, "lead.assigned", "email"),
    ).toBe(true);
    expect(
      preferenceEnabled(preferences, defaults, "task.overdue", "email"),
    ).toBe(false);
  });

  it("shows an event delivered as a digest as enabled", () => {
    expect(
      preferenceEnabled(
        [{ ...row("lead.assigned", "email", true), delivery: "daily" }],
        defaults,
        "lead.assigned",
        "email",
      ),
    ).toBe(true);
  });
});
