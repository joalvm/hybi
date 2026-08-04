import { z } from 'zod';
import { webSocketTransportSchema } from './websocket-schema.js';

const id = z.string().min(1);

/**
 * The persisted transport union, discriminated on `kind` like the type it
 * mirrors. A new transport is one more member here and one more schema file of
 * its own: nothing in this file describes any single protocol.
 */
const transportSchema = z.discriminatedUnion('kind', [webSocketTransportSchema]);

/** Persisted connection. Identity and environment are transport-agnostic. */
export const connectionSchema = z.object({
  id,
  name: z.string().min(1),
  environmentId: id.nullable(),
  transport: transportSchema,
});
