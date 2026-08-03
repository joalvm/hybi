import { z } from 'zod';

const id = z.string().min(1);
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
const settings = z.object({
  headers: z.array(header),
  protocols: z.array(httpToken),
  retry,
  keepalive,
  verifyCertificate: z.boolean(),
  maxMessageBytes: z.number().int().min(1024).max(104857600),
});

/** Persisted connection union. Each transport owns one schema member. */
export const connectionSchema = z.object({
  id,
  name: z.string().min(1),
  environmentId: id.nullable(),
  transport: z.object({
    kind: z.literal('websocket'),
    url: z.string(),
    settings,
  }),
});
