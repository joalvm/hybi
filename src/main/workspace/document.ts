import { format } from '@lang/translate.js';
import {
  runMigrations,
  WORKSPACE_MIGRATIONS,
  WORKSPACE_VERSION,
  WorkspaceMigrationError,
  type MigrationOutcome,
  type WorkspaceMigration,
} from '@shared/domain/migrate.js';
import { parseWorkspace, WorkspaceFormatError } from '@shared/domain/schema.js';
import type { Workspace } from '@shared/domain/types.js';
import { mainMessages } from '../lang.js';

/** `updatedAt` is repository bookkeeping, so it is not part of the domain type. */
export type StoredWorkspace = Workspace & { updatedAt?: string };

export type WorkspaceDocument = {
  workspace: Workspace;
  /** True when the file on disk is behind and has to be rewritten. */
  migrated: boolean;
  updatedAt: string | undefined;
};

/**
 * The wrapper is the sentence the user reads, so it comes from the catalog; the
 * issues stay verbatim because they name fields, not prose.
 */
export function parseWorkspaceDocument(input: unknown): Workspace {
  try {
    return parseWorkspace(input);
  } catch (error) {
    if (!(error instanceof WorkspaceFormatError)) throw error;
    const issues = error.issues.join('; ');
    throw new Error(format(mainMessages().validation.workspaceFile, { issues }), { cause: error });
  }
}

/**
 * Three different reasons, one decision: this file is not touched. Saying which
 * one it is matters — a document from a newer build is a reason to update the
 * application, not a damaged file.
 */
function migrate(input: unknown, steps: readonly WorkspaceMigration[]): MigrationOutcome {
  try {
    return runMigrations(input, steps);
  } catch (error) {
    if (!(error instanceof WorkspaceMigrationError)) throw error;
    const messages = mainMessages().validation;
    const template =
      error.found === null
        ? messages.workspaceVersionMissing
        : error.found > WORKSPACE_VERSION
          ? messages.workspaceVersionNewer
          : messages.workspaceVersionOld;
    throw new Error(format(template, { found: error.found ?? '', expected: error.expected }), {
      cause: error,
    });
  }
}

/**
 * What every reader of a workspace file goes through: parse the JSON, bring the
 * document to the current format, validate it. Nothing that fails any of the
 * three crosses the bridge, and the caller is told whether disk is now stale.
 */
export function readWorkspaceDocument(
  raw: string,
  steps: readonly WorkspaceMigration[] = WORKSPACE_MIGRATIONS,
): WorkspaceDocument {
  const { updatedAt, ...rest } = JSON.parse(raw) as StoredWorkspace;
  const outcome = migrate(rest, steps);
  return { workspace: parseWorkspaceDocument(outcome.document), migrated: outcome.migrated, updatedAt };
}
