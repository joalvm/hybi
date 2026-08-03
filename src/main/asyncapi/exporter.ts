import { parseWorkspace } from '@shared/domain/schema.js';
import type { EventItem, Workspace } from '@shared/domain/types.js';
import { redactSecrets } from '../workspace/redact.js';
import { createAsyncApiServers } from './export-servers.js';
import type { AsyncApiExportDocument, AsyncApiMessage } from './export-types.js';

type PayloadExample = {
  contentType: AsyncApiMessage['contentType'];
  payload: unknown;
  fallbackSchema: unknown;
};

function payloadExample(raw: string): PayloadExample {
  try {
    return { contentType: 'application/json', payload: JSON.parse(raw), fallbackSchema: {} };
  } catch {
    return { contentType: 'text/plain', payload: raw, fallbackSchema: { type: 'string' } };
  }
}

function messageFor(item: EventItem): AsyncApiMessage {
  const example = payloadExample(item.payload);
  return {
    name: item.name,
    title: item.name,
    ...(item.description === undefined
      ? {}
      : { summary: item.description, description: item.description }),
    contentType: example.contentType,
    payload: item.schema ?? example.fallbackSchema,
    examples: [{ name: 'Hybi payload', payload: example.payload }],
    'x-hybi': {
      id: item.id,
      collectionId: item.collectionId,
      source: item.source,
      rawPayload: item.payload,
    },
  };
}

/** Builds valid AsyncAPI 3 while reserving x-hybi for client-only state. */
export function createAsyncApiDocument(workspace: Workspace): AsyncApiExportDocument {
  const safe = redactSecrets(parseWorkspace(workspace));
  const { servers, connectionIds } = createAsyncApiServers(safe);
  const serverRefs = Object.keys(servers).map((id) => ({ $ref: `#/servers/${id}` }));
  const channels: AsyncApiExportDocument['channels'] = {};
  const operations: AsyncApiExportDocument['operations'] = {};
  const messages: AsyncApiExportDocument['components']['messages'] = {};

  safe.catalog.items.forEach((item, index) => {
    const id = `event${String(index + 1)}`;
    const operationId = `receiveEvent${String(index + 1)}`;
    const collection = safe.catalog.collections.find((entry) => entry.id === item.collectionId);
    messages[id] = messageFor(item);
    channels[id] = {
      address: item.name,
      messages: { [id]: { $ref: `#/components/messages/${id}` } },
      ...(serverRefs.length === 0 ? {} : { servers: serverRefs }),
    };
    operations[operationId] = {
      action: 'receive',
      channel: { $ref: `#/channels/${id}` },
      messages: [{ $ref: `#/channels/${id}/messages/${id}` }],
      title: item.name,
      ...(item.description === undefined ? {} : { summary: item.description }),
      ...(collection === undefined ? {} : { tags: [{ name: collection.name }] }),
    };
  });

  return {
    asyncapi: '3.0.0',
    info: {
      title: safe.name,
      version: '1.0.0',
      tags: safe.catalog.collections.map((entry) => ({ name: entry.name })),
    },
    servers,
    channels,
    operations,
    components: { messages },
    'x-hybi': {
      schemaVersion: 1,
      workspace: { id: safe.id, formatVersion: safe.version },
      collections: safe.catalog.collections,
      environments: safe.environments,
      connections: safe.connections.map((entry, index) => ({
        ...entry,
        serverId: connectionIds[index] ?? null,
      })),
      eventOrder: safe.catalog.items.map((entry) => entry.id),
    },
  };
}
