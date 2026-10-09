import { describe, expect, it, vi } from "vitest";
import {
  parseRealtimeConfig,
  subscribeToNotifications,
  type RealtimeClient,
} from "./realtime";

describe("parseRealtimeConfig", () => {
  it("is off until a Reverb key is configured", () => {
    expect(parseRealtimeConfig({ host: "localhost" })).toBeNull();
    expect(parseRealtimeConfig({ key: "  " })).toBeNull();
  });

  it("points at a local Reverb server unless told otherwise", () => {
    expect(parseRealtimeConfig({ key: "crm-local-key" })).toEqual({
      key: "crm-local-key",
      host: "localhost",
      port: 8080,
      secure: false,
    });
  });

  it("uses the secure port by default behind https", () => {
    expect(
      parseRealtimeConfig({
        key: "prod-key",
        host: "ws.vantex.example",
        scheme: "https",
      }),
    ).toEqual({
      key: "prod-key",
      host: "ws.vantex.example",
      port: 443,
      secure: true,
    });
  });
});

/** An Echo stand-in that lets the test push notifications to subscribers. */
function fakeClient() {
  const listeners = new Map<string, (payload: unknown) => void>();
  const client: RealtimeClient = {
    private: (channel) => ({
      notification: (listener) => {
        listeners.set(channel, listener);
      },
    }),
    leave: vi.fn((channel: string) => {
      listeners.delete(channel);
    }),
    disconnect: vi.fn(),
  };
  return { client, listeners };
}

describe("subscribeToNotifications", () => {
  it("listens on the private channel of the user", () => {
    const { client, listeners } = fakeClient();

    subscribeToNotifications(client, {
      userId: 5,
      tenantId: 1,
      onNotification: () => {},
    });

    expect([...listeners.keys()]).toEqual(["App.Models.User.5"]);
  });

  it("hands over the notifications of the active tenant only", () => {
    const { client, listeners } = fakeClient();
    const received: unknown[] = [];
    subscribeToNotifications(client, {
      userId: 5,
      tenantId: 1,
      onNotification: (notification) => received.push(notification),
    });
    const push = listeners.get("App.Models.User.5");

    push?.({ id: "a", tenant_id: 1, title: "Nuevo lead asignado" });
    push?.({ id: "b", tenant_id: 2, title: "De otro espacio" });
    push?.("not a notification");

    expect(received).toEqual([
      { id: "a", tenant_id: 1, title: "Nuevo lead asignado" },
    ]);
  });

  it("leaves the channel and closes the socket when it is no longer needed", () => {
    const { client } = fakeClient();
    const stop = subscribeToNotifications(client, {
      userId: 5,
      tenantId: 1,
      onNotification: () => {},
    });

    stop();

    expect(client.leave).toHaveBeenCalledWith("App.Models.User.5");
    expect(client.disconnect).toHaveBeenCalled();
  });
});
