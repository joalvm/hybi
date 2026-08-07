/** A single `{{name}}` binding. Secret values never reach disk. */
export type Variable = { name: string; value: string; secret: boolean };

/** A named set of variables. A connection resolves `{{name}}` against exactly one. */
export type Environment = { id: string; name: string; variables: Variable[] };

import type { Connection } from './connections/connection.js';

export type {
  Connection,
  ConnectionTransport,
  TransportKind,
} from './connections/connection.js';
export type {
  ConnectionHeader,
  KeepalivePolicy,
  RetryPolicy,
  WebSocketTransport,
  WebSocketTransportSettings,
} from './connections/websocket.js';

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
  version: 1;
  name: string;
  environments: Environment[];
  connections: Connection[];
  catalog: EventCatalog;
};

/** Why a file that is on disk could not be listed as a workspace. */
export type WorkspaceDefect = { path: string; reason: string };

/**
 * One row of the workspace list. `broken` turns the row into a report: the file
 * exists, it is not openable, and hiding it would read as lost work.
 */
export type WorkspaceSummary = {
  id: string;
  name: string;
  updatedAt: string;
  broken?: WorkspaceDefect;
};
