/** The format this build reads and writes. Bumping it means adding a step below. */
export const WORKSPACE_VERSION = 1;

/** A stored document before validation: shape unknown, version merely claimed. */
export type WorkspaceDocument = Record<string, unknown>;

/**
 * One hop of the chain. Steps are consecutive, so a document three formats
 * behind is upgraded by three of them rather than by a single function that has
 * to remember every shape the file ever had.
 */
export type WorkspaceMigration = {
  from: number;
  to: number;
  apply: (document: WorkspaceDocument) => WorkspaceDocument;
};

/**
 * Empty because v1 is the only format that has shipped. The chain exists before
 * it has anything to carry on purpose: everything around it — the copy of the
 * original file, the refusal to touch a newer document — is already written and
 * tested, so the first real step is one entry here instead of a new code path.
 */
export const WORKSPACE_MIGRATIONS: readonly WorkspaceMigration[] = [];

export type MigrationOutcome = {
  document: WorkspaceDocument;
  /** True when at least one step ran, which is what makes a backup necessary. */
  migrated: boolean;
  /** The version found on disk; `null` when the file declared none. */
  from: number | null;
};

/**
 * A document this build cannot bring to the current format. It covers three
 * cases that are the same decision — do not touch this file — rather than three
 * different ones: no version, a version from the future, and a version no step
 * knows how to leave behind.
 */
export class WorkspaceMigrationError extends Error {
  constructor(
    readonly found: number | null,
    readonly expected: number,
  ) {
    super(`Cannot migrate workspace format ${found === null ? 'unknown' : String(found)} to ${String(expected)}`);
    this.name = 'WorkspaceMigrationError';
  }
}

function versionOf(document: unknown): number | null {
  if (typeof document !== 'object' || document === null) return null;
  const version: unknown = (document as WorkspaceDocument).version;
  return typeof version === 'number' && Number.isInteger(version) ? version : null;
}

/**
 * The engine, with the chain passed in so a step can be exercised without one
 * having to exist in the shipped list.
 */
export function runMigrations(
  input: unknown,
  steps: readonly WorkspaceMigration[],
  target: number = WORKSPACE_VERSION,
): MigrationOutcome {
  const from = versionOf(input);
  if (from === null || from > target) throw new WorkspaceMigrationError(from, target);

  let document = input as WorkspaceDocument;
  let version = from;
  while (version < target) {
    const step = steps.find((candidate) => candidate.from === version);
    if (step === undefined) throw new WorkspaceMigrationError(from, target);
    // The step declares where it lands, so one that forgets to stamp the
    // version cannot leave the document claiming the format it came from.
    document = { ...step.apply(document), version: step.to };
    version = step.to;
  }

  return { document, migrated: version !== from, from };
}

export function migrateWorkspace(input: unknown): MigrationOutcome {
  return runMigrations(input, WORKSPACE_MIGRATIONS);
}
