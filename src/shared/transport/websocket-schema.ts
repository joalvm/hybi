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

export const webSocketTransportMessageSchema = z
  .object({ kind: z.literal('websocket'), text: z.string().max(104857600) })
  .strict();
