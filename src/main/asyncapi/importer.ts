import { basename } from 'node:path';
import type {
  MessageInterface,
  OperationAction,
  OperationInterface,
} from '@asyncapi/parser';
import type { Collection, EventItem } from '@shared/domain/types.js';
import type { ImportResult } from '@shared/ipc/contract.js';
import { exampleFromSchema } from './example.js';

export class AsyncApiImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AsyncApiImportError';
  }
}

const DOMAIN_TAG = /^(?:domain|group|module):(.+)$/i;

/**
 * `DiagnosticSeverity.Error` as a plain number. The parser re-exports that enum
 * from the hoisted `@stoplight/types`, while `Diagnostic.severity` comes from
 * the nested copy under `@stoplight/spectral-core` — two distinct enum
 * identities that TypeScript refuses to compare.
 */
const ERROR_SEVERITY = 0;

/** Widening `severity` to `number` at the boundary keeps the enums apart. */
function isFatal(entry: { severity: number }): boolean {
  return entry.severity === ERROR_SEVERITY;
}

/**
 * Turns any AsyncAPI 2.x or 3.x document into catalog entries.
 *
 * A document always describes its own application — normally the server under
 * test — so the operations that application *receives* are exactly the ones
 * this client can send. Emissions flowing the other way are left out: the
 * catalog is a palette of things to send, not a list of things to expect.
 */
export async function importAsyncApi(filePath: string): Promise<ImportResult> {
  // Imported here rather than at module scope: the parser drags in
  // `@stoplight/spectral-core`, which is several megabytes of CommonJS and
  // would otherwise be parsed on every cold start for a feature many sessions
  // never touch. The loader caches it after the first import.
  const { Parser, fromFile } = await import('@asyncapi/parser');
  const parser = new Parser();
  const { document, diagnostics } = await fromFile(parser, filePath).parse();

  if (document === undefined) {
    const detail = diagnostics
      .filter(isFatal)
      .map((entry) => entry.message)
      .join('; ');
    throw new AsyncApiImportError(
      detail === '' ? `Could not parse ${basename(filePath)}` : detail,
    );
  }

  const collections = new Map<string, Collection>();
  const items: EventItem[] = [];
  // Untagged operations still need a home: collection membership is mandatory,
  // so they group under the document they came from.
  const fallbackName = basename(filePath).replace(/\.[^.]+$/, '');

  for (const operation of document.operations()) {
    if (!isAccepted(operation.action())) continue;

    // Only the first message of an operation becomes an entry. Operations with
    // several message variants would otherwise flood the catalog with
    // near-identical items.
    const message = operation.messages().all()[0];
    if (message === undefined) continue;

    const item = toEventItem(operation, message, collections, fallbackName);
    if (item !== null) items.push(item);
  }

  if (items.length === 0) {
    throw new AsyncApiImportError(
      `${basename(filePath)} has no operations this client could send`,
    );
  }

  return { collections: [...collections.values()], items, sourceName: basename(filePath) };
}

/**
 * `receive` is the v3 spelling. The parser converts 2.x documents, where the
 * equivalent is `publish` — v2 named operations after what *other* parties do,
 * so `publish` is the side the application accepts. Both are kept in case an
 * unconverted document reaches here.
 */
function isAccepted(action: OperationAction): boolean {
  return action === 'receive' || action === 'publish';
}

function toEventItem(
  operation: OperationInterface,
  message: MessageInterface,
  collections: Map<string, Collection>,
  fallbackName: string,
): EventItem | null {
  const name = eventName(operation, message);
  if (name === null) return null;

  const schema = message.payload()?.json();
  const summary = operation.summary() ?? message.summary();
  const collectionName = collectionFor([
    ...operation.tags().all().map((tag) => tag.name()),
    ...message.tags().all().map((tag) => tag.name()),
  ]);

  return {
    id: globalThis.crypto.randomUUID(),
    collectionId: ensureCollection(collections, collectionName ?? fallbackName),
    name,
    payload: JSON.stringify({ event: name, data: exampleFromSchema(schema ?? {}) }, null, 2),
    source: 'asyncapi',
    ...(schema === undefined ? {} : { schema: envelopeSchema(name, schema) }),
    ...(summary === undefined ? {} : { description: summary }),
  };
}

/**
 * The catalog sends `{ event, data }` — the envelope a NestJS gateway and most
 * `ws` event routers expect — so the stored schema has to describe that envelope
 * and not the bare message. Keeping the message schema made every imported event
 * open with a validation error, since what got validated was the wrapper.
 *
 * `additionalProperties` is left open: servers that carry an extra field next to
 * `event` and `data` are common, and the document says nothing about them.
 */
function envelopeSchema(name: string, payload: unknown): Record<string, unknown> {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: { event: { const: name }, data: withoutDialect(payload) },
    required: ['event', 'data'],
  };
}

/**
 * `$schema` only means anything at the root of a document, and the parser puts
 * one on every message schema. Nested, it is at best ignored and at worst a
 * compile error, so it is dropped as the schema moves under `data`.
 */
function withoutDialect(schema: unknown): unknown {
  if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) return schema;
  const { $schema: _dialect, ...rest } = schema as Record<string, unknown>;
  return rest;
}

/**
 * The channel address is the string that actually travels on the wire — for a
 * NestJS gateway it is the `@SubscribeMessage` argument. Message names tend to
 * be handler-derived ids (`handleDeviceLoginMessage`), so they are only a
 * fallback for documents that leave channels unaddressed.
 */
function eventName(operation: OperationInterface, message: MessageInterface): string | null {
  const channel = operation.channels().all()[0];
  const candidates = [channel?.address(), message.name(), channel?.id(), operation.id()];
  return candidates.find((value) => typeof value === 'string' && value.length > 0) ?? null;
}

function collectionFor(tagNames: string[]): string | null {
  for (const tag of tagNames) {
    const match = DOMAIN_TAG.exec(tag);
    if (match?.[1] !== undefined) return match[1];
  }
  return tagNames.find((tag) => !tag.includes(':')) ?? null;
}

function ensureCollection(collections: Map<string, Collection>, name: string): string {
  const existing = collections.get(name);
  if (existing !== undefined) return existing.id;
  const collection: Collection = { id: globalThis.crypto.randomUUID(), name };
  collections.set(name, collection);
  return collection.id;
}
