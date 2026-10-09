/** Where the Reverb server of the API listens. */
export interface RealtimeConfig {
  key: string;
  host: string;
  port: number;
  secure: boolean;
}

/** The part of Laravel Echo this app uses. */
export interface RealtimeClient {
  private: (channel: string) => {
    notification: (listener: (payload: unknown) => void) => unknown;
  };
  leave: (channel: string) => void;
  disconnect: () => void;
}

/** Realtime stays off until a Reverb key is configured. */
export function parseRealtimeConfig(env: {
  key?: string;
  host?: string;
  port?: string;
  scheme?: string;
}): RealtimeConfig | null {
  const key = env.key?.trim();
  if (!key) return null;
  const secure = env.scheme === "https";
  return {
    key,
    host: env.host?.trim() || "localhost",
    port: Number(env.port) || (secure ? 443 : 8080),
    secure,
  };
}

// Next.js only inlines NEXT_PUBLIC variables that are read by their full name.
const config = parseRealtimeConfig({
  key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
  host: process.env.NEXT_PUBLIC_REVERB_HOST,
  port: process.env.NEXT_PUBLIC_REVERB_PORT,
  scheme: process.env.NEXT_PUBLIC_REVERB_SCHEME,
});

export const realtimeEnabled = config !== null;

/**
 * Opens a socket to Reverb, or resolves to `null` when realtime is not
 * configured. Private channels are authorized through the backend proxy, which
 * adds the session token the browser cannot read.
 */
export async function connectRealtime(): Promise<RealtimeClient | null> {
  if (!config || typeof window === "undefined") return null;
  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);
  return new Echo({
    broadcaster: "reverb",
    Pusher,
    key: config.key,
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: config.secure,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/api/backend/broadcasting/auth",
  });
}

/**
 * Listens to the notifications Laravel broadcasts to a user. The channel is
 * per user, not per tenant, so the ones of other tenants are dropped here.
 * Returns the function that stops listening and closes the socket.
 */
export function subscribeToNotifications(
  client: RealtimeClient,
  {
    userId,
    tenantId,
    onNotification,
  }: {
    userId: number;
    tenantId: number;
    onNotification: (notification: Record<string, unknown>) => void;
  },
) {
  const channel = "App.Models.User." + userId;
  client.private(channel).notification((payload) => {
    if (typeof payload !== "object" || payload === null) return;
    const notification = payload as Record<string, unknown>;
    if (notification.tenant_id === tenantId) onNotification(notification);
  });
  return () => {
    client.leave(channel);
    client.disconnect();
  };
}
