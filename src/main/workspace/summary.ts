import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { WorkspaceMigration } from '@shared/domain/migrate.js';
import type { WorkspaceSummary } from '@shared/domain/types.js';
import { readWorkspaceDocument } from './document.js';

const EPOCH = new Date(0).toISOString();

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * One row of the list, and it always produces one. A file that cannot be read
 * used to be dropped here, which is the worst failure this product can have and
 * it was silent: the user saw a workspace missing from the list and concluded
 * the work was gone. It now comes back marked, with its path and its reason, so
 * discarding it is a decision instead of an accident.
 *
 * The whole document is validated rather than only its header — a file that
 * lists fine and then refuses to open is the same disappearing act one step
 * later.
 */
export async function summarizeWorkspaceFile(
  path: string,
  steps?: readonly WorkspaceMigration[],
): Promise<WorkspaceSummary> {
  try {
    const raw = await readFile(path, 'utf8');
    const { workspace, updatedAt } = readWorkspaceDocument(raw, steps);
    return { id: workspace.id, name: workspace.name, updatedAt: updatedAt ?? EPOCH };
  } catch (error) {
    // The id is the file name because the one inside is exactly what could not
    // be read, and the file name is what `remove()` needs to discard it.
    return {
      id: basename(path, '.json'),
      name: basename(path),
      updatedAt: EPOCH,
      broken: { path, reason: messageOf(error) },
    };
  }
}
