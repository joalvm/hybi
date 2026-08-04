import { z } from 'zod';

const httpToken = z.string().regex(/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/);

const header = z.object({
  name: httpToken,
  value: z.string().regex(/^[^\r\n]*$/, 'must not contain a line break'),
  enabled: z.boolean(),
});

const retry = z.object({
  enabled: z.boolean(),
  attempts: z.number().int().min(0).max(100),
  baseMs: z.number().int().min(100).max(60000),
  maxMs: z.number().int().min(100).max(300000),
});

const keepalive = z.object({
  enabled: z.boolean(),
  intervalMs: z.number().int().min(1000).max(600000),
  timeoutMs: z.number().int().min(500).max(600000),
});

export const webSocketTransportSettingsSchema = z.object({
  headers: z.array(header),
  protocols: z.array(httpToken),
  retry,
  keepalive,
  verifyCertificate: z.boolean(),
  maxMessageBytes: z.number().int().min(1024).max(104857600),
});

/**
 * The persisted half of the WebSocket transport. It lives beside the type it
 * validates, the same way `transport/websocket-schema.ts` holds the resolved
 * half: adding a transport means adding a file, never editing a shared one.
 */
export const webSocketTransportSchema = z.object({
  kind: z.literal('websocket'),
  url: z.string(),
  settings: webSocketTransportSettingsSchema,
});
