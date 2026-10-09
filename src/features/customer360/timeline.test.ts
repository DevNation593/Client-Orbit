import { describe, expect, it } from "vitest";
import { timelineEventToEntry, type TimelineEvent } from "./timeline";

function event(overrides: Partial<TimelineEvent>): TimelineEvent {
  return {
    id: "activity:42",
    source: "activity",
    event: "call",
    subject: "Llamada de seguimiento",
    body: "Acordamos una demo.",
    entity: { type: "contact", id: 7 },
    actor: { id: 5, name: "Luis Mora" },
    // The API serializes empty metadata as an empty array.
    metadata: [],
    occurred_at: "2026-10-02T15:30:00.000000Z",
    ...overrides,
  };
}

describe("timelineEventToEntry", () => {
  it("keeps a logged interaction as it was recorded", () => {
    expect(timelineEventToEntry(event({}))).toEqual({
      id: "activity:42",
      type: "call",
      subject: "Llamada de seguimiento",
      body: "Acordamos una demo.",
      user: { id: 5, name: "Luis Mora" },
      occurred_at: "2026-10-02T15:30:00.000000Z",
    });
  });

  it("describes a domain event in Spanish instead of its raw event name", () => {
    const entry = timelineEventToEntry(
      event({
        id: "activity:43",
        event: "contact.created",
        subject: "contact · created",
        body: null,
      }),
    );

    expect(entry.subject).toBe("Contacto creado");
    expect(entry.type).toBe("system");
  });

  it("files opportunity events under sales", () => {
    const entry = timelineEventToEntry(
      event({
        event: "opportunity.stage_changed",
        subject: "opportunity · stage changed",
        body: null,
        entity: { type: "deal", id: 12 },
      }),
    );

    expect(entry.type).toBe("deal");
    expect(entry.subject).toBe("Oportunidad cambió de etapa");
  });

  it("files channel events under their channel", () => {
    expect(
      timelineEventToEntry(event({ event: "whatsapp.received" })).type,
    ).toBe("whatsapp");
    expect(timelineEventToEntry(event({ event: "email.opened" })).type).toBe(
      "email",
    );
    expect(timelineEventToEntry(event({ event: "meeting.booked" })).type).toBe(
      "meeting",
    );
    expect(timelineEventToEntry(event({ event: "task.completed" })).type).toBe(
      "task",
    );
  });

  it("lists the business fields an audit event touched, leaving out internal columns", () => {
    expect(
      timelineEventToEntry(
        event({
          id: "audit:9",
          source: "audit",
          event: "audit.update",
          subject: "Update",
          body: null,
          entity: { type: "contacts", id: "7" },
          metadata: {
            changed_fields: [
              "id",
              "tenant_id",
              "email",
              "phone",
              "created_at",
              "updated_at",
              "deleted_at",
              "email_normalized",
              "phone_normalized",
            ],
          },
        }),
      ),
    ).toEqual({
      id: "audit:9",
      type: "system",
      subject: "Registro actualizado",
      body: "Campos modificados: email, phone",
      user: { id: 5, name: "Luis Mora" },
      occurred_at: "2026-10-02T15:30:00.000000Z",
    });
  });

  it("says which fields a domain event changed", () => {
    const entry = timelineEventToEntry(
      event({
        event: "contact.updated",
        subject: "contact · updated",
        body: null,
        metadata: { changed_fields: ["phone"] },
      }),
    );

    expect(entry.subject).toBe("Contacto actualizado");
    expect(entry.body).toBe("Campos modificados: phone");
  });

  it("summarizes long lists of changed fields", () => {
    const entry = timelineEventToEntry(
      event({
        source: "audit",
        event: "audit.create",
        subject: "Create",
        body: null,
        metadata: {
          changed_fields: [
            "first_name",
            "last_name",
            "email",
            "phone",
            "status",
            "owner_id",
            "custom_fields",
            "territory_id",
          ],
        },
      }),
    );

    expect(entry.subject).toBe("Registro creado");
    expect(entry.body).toBe(
      "Campos modificados: first_name, last_name, email, phone, status, owner_id y 2 más",
    );
  });

  it("files quote activity under quotes", () => {
    const entry = timelineEventToEntry(
      event({
        id: "quote:3",
        source: "quote",
        event: "quote.sent",
        subject: "Quote · sent",
        body: null,
        entity: { type: "quote", id: 3 },
      }),
    );

    expect(entry.type).toBe("quote");
    expect(entry.subject).toBe("Quote · sent");
  });

  it("leaves the author empty for events without an actor", () => {
    expect(timelineEventToEntry(event({ actor: null })).user).toBeNull();
  });
});
