import { z } from 'zod';
import type {
  CloseConnectionRequest,
  OpenConnectionRequest,
  SendConnectionRequest,
} from './contract.js';
import {
  resolvedWebSocketTransportSchema,
  webSocketTransportMessageSchema,
} from './websocket-schema.js';

const connectionId = z.string().min(1).max(128).regex(/^[A-Za-z0-9-]+$/);

const openConnectionRequest = z
  .object({ connectionId, transport: resolvedWebSocketTransportSchema })
  .strict();
const sendConnectionRequest = z
  .object({
    connectionId,
    message: webSocketTransportMessageSchema,
  })
  .strict();
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
