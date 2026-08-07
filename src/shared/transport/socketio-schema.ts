import { z } from 'zod';

const httpToken = z.string().regex(/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/);
const path = z.string().regex(/^\/[^\s?#]*$/, 'must be an absolute path');

export const resolvedSocketIoTransportSchema = z
  .object({
    kind: z.literal('socketio'),
    url: z.string().min(1).max(8192),
    namespace: path,
    path,
    // Text values only: the handshake payload is serialized by the client, and
    // anything richer would cross the bridge as a shape the schema never saw.
    auth: z.record(z.string().min(1).max(128), z.string().max(16384)),
    headers: z.record(httpToken, z.string().max(16384).regex(/^[^\r\n]*$/)),
    transports: z.array(z.enum(['polling', 'websocket'])).min(1).max(2),
    retry: z
      .object({
        enabled: z.boolean(),
        attempts: z.number().int().min(0).max(100),
        baseMs: z.number().int().min(100).max(60000),
        maxMs: z.number().int().min(100).max(300000),
      })
      .strict(),
    ackTimeoutMs: z.number().int().min(100).max(600000),
    verifyCertificate: z.boolean(),
    maxMessageBytes: z.number().int().min(1024).max(104857600),
  })
  .strict();

/**
 * The same bound as the WebSocket message, and for the same reason: base64
 * carries four characters for every three bytes, so the string ceiling sits a
 * third above the largest argument the transport will emit. What decides
 * whether an emit happens is `maxMessageBytes`, measured on the decoded value.
 */
const MAX_MESSAGE_CHARACTERS = 139810134;

const RESERVED_EVENTS = new Set([
  'connect',
  'connect_error',
  'disconnect',
  'disconnecting',
  'newListener',
  'removeListener',
]);

export const socketIoTransportMessageSchema = z
  .object({
    kind: z.literal('socketio'),
    // Socket.IO reserves a handful of names for its own lifecycle. Emitting one
    // would fire a client event rather than reach the server.
    event: z
      .string()
      .min(1)
      .max(256)
      .refine((name) => !RESERVED_EVENTS.has(name), 'is reserved by Socket.IO'),
    body: z.string().max(MAX_MESSAGE_CHARACTERS),
    encoding: z.enum(['text', 'base64']),
    ack: z.boolean(),
  })
  .strict();
