import { z } from 'zod';

const httpToken = z.string().regex(/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/);

export const resolvedWebSocketTransportSchema = z
  .object({
    kind: z.literal('websocket'),
    url: z.string().min(1).max(8192),
    headers: z.record(httpToken, z.string().max(16384).regex(/^[^\r\n]*$/)),
    protocols: z.array(httpToken).max(32),
    retry: z
      .object({
        enabled: z.boolean(),
        attempts: z.number().int().min(0).max(100),
        baseMs: z.number().int().min(100).max(60000),
        maxMs: z.number().int().min(100).max(300000),
      })
      .strict(),
    keepalive: z
      .object({
        enabled: z.boolean(),
        intervalMs: z.number().int().min(1000).max(600000),
        timeoutMs: z.number().int().min(500).max(600000),
      })
      .strict(),
    verifyCertificate: z.boolean(),
    maxMessageBytes: z.number().int().min(1024).max(104857600),
  })
  .strict();

/**
 * Base64 carries four characters for every three bytes, so the string bound is
 * a third above the largest frame the transport will accept. It is a bound on
 * what may cross the bridge at all; the ceiling that decides whether a frame is
 * sent is `maxMessageBytes`, measured on the decoded payload.
 */
const MAX_MESSAGE_CHARACTERS = 139810134;

export const webSocketTransportMessageSchema = z
  .object({
    kind: z.literal('websocket'),
    body: z.string().max(MAX_MESSAGE_CHARACTERS),
    encoding: z.enum(['text', 'base64']),
  })
  .strict();
