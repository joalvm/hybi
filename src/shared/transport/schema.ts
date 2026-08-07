import { z } from 'zod';
import type {
  CloseConnectionRequest,
  OpenConnectionRequest,
  SendConnectionRequest,
} from './contract.js';
import {
  resolvedSocketIoTransportSchema,
  socketIoTransportMessageSchema,
} from './socketio-schema.js';
import {
  resolvedWebSocketTransportSchema,
  webSocketTransportMessageSchema,
} from './websocket-schema.js';

const connectionId = z.string().min(1).max(128).regex(/^[A-Za-z0-9-]+$/);

/**
 * Discriminated on `kind`, so what crosses IPC is the union and not one member
 * of it. This is the boundary that decides which adapter a request reaches:
 * adding a transport is a new member here, and the factory map in
 * `main/connections/transport.ts` then refuses to compile until it has an
 * adapter to send it to.
 */
const resolvedTransport = z.discriminatedUnion('kind', [
  resolvedWebSocketTransportSchema,
  resolvedSocketIoTransportSchema,
]);
const transportMessage = z.discriminatedUnion('kind', [
  webSocketTransportMessageSchema,
  socketIoTransportMessageSchema,
]);

const openConnectionRequest = z.object({ connectionId, transport: resolvedTransport }).strict();
const sendConnectionRequest = z.object({ connectionId, message: transportMessage }).strict();
const closeConnectionRequest = z.object({ connectionId }).strict();

export function parseOpenConnectionRequest(input: unknown): OpenConnectionRequest {
  return parse(openConnectionRequest, input, 'connection open request');
}

export function parseSendConnectionRequest(input: unknown): SendConnectionRequest {
  return parse(sendConnectionRequest, input, 'connection send request');
}

export function parseCloseConnectionRequest(input: unknown): CloseConnectionRequest {
  return parse(closeConnectionRequest, input, 'connection close request');
}

function parse<T>(schema: z.ZodType<T>, input: unknown, label: string): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid ${label}: ${issues.join('; ')}`);
}
