import { z } from 'zod';

const httpToken = z.string().regex(/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/);

const header = z.object({
  name: httpToken,
  value: z.string().regex(/^[^\r\n]*$/, 'must not contain a line break'),
  enabled: z.boolean(),
});

/** A key of the handshake `auth` object; the value is free text. */
const authEntry = z.object({
  name: z.string().min(1).max(128),
  value: z.string(),
  enabled: z.boolean(),
});

/** Both a namespace and an engine.io mount point are absolute paths. */
const path = z.string().regex(/^\/[^\s?#]*$/, 'must be an absolute path');

export const socketIoTransportSettingsSchema = z.object({
  namespace: path,
  path,
  auth: z.array(authEntry),
  headers: z.array(header),
  // At least one, because a client that offers none has no way to connect at
  // all — an empty list is a configuration that can only ever fail.
  transports: z.array(z.enum(['polling', 'websocket'])).min(1).max(2),
  retry: z.object({
    enabled: z.boolean(),
    attempts: z.number().int().min(0).max(100),
    baseMs: z.number().int().min(100).max(60000),
    maxMs: z.number().int().min(100).max(300000),
  }),
  ackTimeoutMs: z.number().int().min(100).max(600000),
  verifyCertificate: z.boolean(),
  maxMessageBytes: z.number().int().min(1024).max(104857600),
});

/**
 * The persisted half of the Socket.IO transport, beside the type it validates
 * and beside nothing else: adding a transport means adding a file of its own.
 */
export const socketIoTransportSchema = z.object({
  kind: z.literal('socketio'),
  url: z.string(),
  settings: socketIoTransportSettingsSchema,
});
