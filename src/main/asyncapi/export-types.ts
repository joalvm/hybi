import type { Collection, Connection, Environment, EventSource } from '@shared/domain/types.js';

export type AsyncApiServer = {
  host: string;
  protocol: 'ws' | 'wss';
  title: string;
  pathname?: string;
  variables?: Record<string, { default: string }>;
};

export type AsyncApiMessage = {
  name: string;
  title: string;
  summary?: string;
  description?: string;
  contentType: 'application/json' | 'text/plain';
  payload: unknown;
  examples: { name: string; payload: unknown }[];
  'x-hybi': {
    id: string;
    collectionId: string;
    source: EventSource;
    rawPayload: string;
  };
};

export type AsyncApiExportDocument = {
  asyncapi: '3.0.0';
  info: {
    title: string;
    version: '1.0.0';
    tags: { name: string }[];
  };
  servers: Record<string, AsyncApiServer>;
  channels: Record<string, Record<string, unknown>>;
  operations: Record<string, Record<string, unknown>>;
  components: { messages: Record<string, AsyncApiMessage> };
  'x-hybi': {
    schemaVersion: 1;
    workspace: { id: string; formatVersion: 4 };
    collections: Collection[];
    environments: Environment[];
    connections: (Connection & { serverId: string | null })[];
    eventOrder: string[];
  };
};
