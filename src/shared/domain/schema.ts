import { z } from 'zod';
import type { Workspace } from './types.js';

export class WorkspaceFormatError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid workspace file: ${issues.join('; ')}`);
    this.name = 'WorkspaceFormatError';
  }
}

const id = z.string().min(1);

/** Mirrors the pattern the `{{name}}` scanner accepts, so every stored name is referenceable. */
const variableSchema = z.object({
  name: z.string().regex(/^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/),
  value: z.string(),
  secret: z.boolean(),
});

const environmentSchema = z.object({
  id,
  name: z.string().min(1),
  variables: z.array(variableSchema),
});

/** RFC 7230 token. A name outside it is one the handshake would reject anyway. */
const httpToken = z.string().regex(/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/);

/**
 * A stored value may hold `{{variables}}`, so it is free text — with one
 * exception: CR and LF end a header line, and a value carrying either would let
 * whatever follows it be read as a header of its own. The renderer strips them
 * from resolved values too, since a variable can smuggle one in later.
 */
const connectionHeaderSchema = z.object({
  name: httpToken,
  value: z.string().regex(/^[^\r\n]*$/, 'must not contain a line break'),
  enabled: z.boolean(),
});

const retryPolicySchema = z.object({
  enabled: z.boolean(),
  attempts: z.number().int().min(0).max(100),
  baseMs: z.number().int().min(100).max(60000),
  maxMs: z.number().int().min(100).max(300000),
});

const keepalivePolicySchema = z.object({
  enabled: z.boolean(),
  intervalMs: z.number().int().min(1000).max(600000),
  timeoutMs: z.number().int().min(500).max(600000),
});

const connectionSettingsSchema = z.object({
  headers: z.array(connectionHeaderSchema),
  protocols: z.array(httpToken),
  retry: retryPolicySchema,
  keepalive: keepalivePolicySchema,
  verifyCertificate: z.boolean(),
  // A ceiling below a kilobyte closes every real frame; the top is the `ws`
  // default, which is already generous for a client that keeps frames in memory.
  maxMessageBytes: z.number().int().min(1024).max(104857600),
});

const connectionSchema = z.object({
  id,
  name: z.string().min(1),
  url: z.string(),
  environmentId: id.nullable(),
  settings: connectionSettingsSchema,
});

const collectionSchema = z.object({ id, name: z.string().min(1) });

const eventItemSchema = z.object({
  id,
  collectionId: id,
  name: z.string().min(1),
  payload: z.string(),
  source: z.enum(['manual', 'asyncapi']),
  schema: z.unknown().optional(),
  description: z.string().optional(),
});

const baseWorkspaceSchema = z.object({
  id,
  version: z.literal(3),
  name: z.string().min(1),
  environments: z.array(environmentSchema),
  connections: z.array(connectionSchema),
  catalog: z.object({
    collections: z.array(collectionSchema),
    items: z.array(eventItemSchema),
  }),
});

export const workspaceSchema = baseWorkspaceSchema.superRefine((workspace, ctx) => {
  const environmentIds = new Set(workspace.environments.map((item) => item.id));
  for (const [index, connection] of workspace.connections.entries()) {
    if (connection.environmentId !== null && !environmentIds.has(connection.environmentId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['connections', index, 'environmentId'],
        message: `unknown environmentId "${connection.environmentId}"`,
      });
    }
  }

  // Membership is mandatory, so an event naming a collection that is not there
  // is a broken document rather than a state the UI has to render.
  const collectionIds = new Set(workspace.catalog.collections.map((item) => item.id));
  for (const [index, item] of workspace.catalog.items.entries()) {
    if (!collectionIds.has(item.collectionId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['catalog', 'items', index, 'collectionId'],
        message: `unknown collectionId "${item.collectionId}"`,
      });
    }
  }
});

export function parseWorkspace(input: unknown): Workspace {
  const result = workspaceSchema.safeParse(input);
  if (!result.success) {
    throw new WorkspaceFormatError(
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  return result.data as Workspace;
}
