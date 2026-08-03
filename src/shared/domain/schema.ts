import { z } from 'zod';
import type { Workspace } from './types.js';
import { connectionSchema } from './connections/schema.js';

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
  version: z.literal(4),
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
