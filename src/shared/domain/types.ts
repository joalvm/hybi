/** A single `{{name}}` binding. Secret values never reach disk. */
export type Variable = { name: string; value: string; secret: boolean };

/** A named set of variables. A connection resolves `{{name}}` against exactly one. */
export type Environment = { id: string; name: string; variables: Variable[] };

/**
 * One handshake header. `value` is a template like the URL, so a token lives in
 * a `{{variable}}` — that is the only way a secret gets into a header, and it is
 * the mechanism `redactSecrets` already keeps off disk.
 *
 * `enabled` rather than deleting the row: a header switched off while a problem
 * is chased is the point of having the list.
 */
export type ConnectionHeader = { name: string; value: string; enabled: boolean };

/** Reconnection after the peer drops a connection that had reached `open`. */
export type RetryPolicy = { enabled: boolean; attempts: number; baseMs: number; maxMs: number };

/**
 * Protocol-level ping. `timeoutMs` is how long a pong may take before the socket
 * counts as dead — a connection cut by an intermediary reports nothing at all,
 * so without this the session sits in `open` with the wire already gone.
 */
export type KeepalivePolicy = { enabled: boolean; intervalMs: number; timeoutMs: number };

/**
 * Everything about *how* a connection is opened, as opposed to where it points.
 * Per connection and nothing else: no workspace or app-level layer to inherit
 * from, so what the dialog shows is what the socket gets.
 */
export type ConnectionSettings = {
  headers: ConnectionHeader[];
  /** `Sec-WebSocket-Protocol`, in order of preference. */
  protocols: string[];
  retry: RetryPolicy;
  keepalive: KeepalivePolicy;
  /**
   * `false` accepts any certificate the server offers, which removes the only
   * thing standing between a `wss://` session and an active interception. It is
   * here for self-signed certificates on a development box; the dialog warns
   * permanently while it is off.
   */
  verifyCertificate: boolean;
  /** Ceiling on an incoming frame. The peer is closed with 1009 above it. */
  maxMessageBytes: number;
};

/** A saved connection. `url` is a template and may contain `{{variables}}`. */
export type Connection = {
  id: string;
  name: string;
  url: string;
  environmentId: string | null;
  settings: ConnectionSettings;
};

/** A named group of events. Nothing else groups the catalog. */
export type Collection = { id: string; name: string };

export type EventSource = 'manual' | 'asyncapi';

/**
 * A catalog entry. `payload` is raw text sent verbatim after variable
 * resolution — nothing wraps or unwraps it. `schema` is present only for
 * entries that came from an AsyncAPI import.
 *
 * `collectionId` is required: an event outside a collection cannot exist.
 */
export type EventItem = {
  id: string;
  collectionId: string;
  name: string;
  payload: string;
  source: EventSource;
  schema?: unknown;
  description?: string;
};

export type EventCatalog = { collections: Collection[]; items: EventItem[] };

/** A workspace owns its connections, its environments and its shared catalog. */
export type Workspace = {
  id: string;
  version: 3;
  name: string;
  environments: Environment[];
  connections: Connection[];
  catalog: EventCatalog;
};

export type WorkspaceSummary = { id: string; name: string; updatedAt: string };
