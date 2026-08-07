/** One handshake header. Secret values stay in referenced variables. */
export type ConnectionHeader = { name: string; value: string; enabled: boolean };

/**
 * Reconnection after a peer drops a connection that had reached `open`. Shared
 * rather than declared per transport: a native socket reconnects because this
 * app schedules it and Socket.IO reconnects on its own, but the user is
 * answering the same four questions either way.
 */
export type RetryPolicy = { enabled: boolean; attempts: number; baseMs: number; maxMs: number };
