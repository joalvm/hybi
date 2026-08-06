import { describe, expect, it } from 'vitest';
import { createWorkspace } from '@shared/domain/factory.js';
import {
  migrateWorkspace,
  runMigrations,
  WORKSPACE_VERSION,
  WorkspaceMigrationError,
  type WorkspaceMigration,
} from '@shared/domain/migrate.js';

const rename: WorkspaceMigration = {
  from: 0,
  to: 1,
  apply: (document) => ({ ...document, name: 'upgraded' }),
};

describe('runMigrations', () => {
  it('leaves a document already on the current format untouched', () => {
    const workspace = createWorkspace('Demo');
    const outcome = migrateWorkspace(structuredClone(workspace));

    expect(outcome.migrated).toBe(false);
    expect(outcome.document).toEqual(workspace);
  });

  it('walks every step between the stored version and the current one', () => {
    const second: WorkspaceMigration = {
      from: 1,
      to: 2,
      apply: (document) => ({ ...document, extra: true }),
    };
    const outcome = runMigrations({ version: 0, name: 'old' }, [rename, second], 2);

    expect(outcome).toEqual({
      document: { version: 2, name: 'upgraded', extra: true },
      migrated: true,
      from: 0,
    });
  });

  /** The step declares where it lands, so a step that forgets cannot lie. */
  it('stamps the version each step declares', () => {
    const forgetful: WorkspaceMigration = { from: 0, to: 1, apply: (document) => document };
    expect(runMigrations({ version: 0 }, [forgetful]).document.version).toBe(1);
  });

  it('refuses a document saved by a newer build instead of reshaping it', () => {
    const document = { ...createWorkspace('Demo'), version: WORKSPACE_VERSION + 1 };
    expect(() => migrateWorkspace(document)).toThrow(WorkspaceMigrationError);
  });

  it('refuses a document whose version no step covers', () => {
    expect(() => runMigrations({ version: 0 }, [])).toThrow(WorkspaceMigrationError);
  });

  it('reports a missing version as unknown rather than as zero', () => {
    try {
      migrateWorkspace({ name: 'no version here' });
      expect.unreachable('a document without a version cannot be migrated');
    } catch (error) {
      expect(error).toBeInstanceOf(WorkspaceMigrationError);
      expect((error as WorkspaceMigrationError).found).toBeNull();
    }
  });

  it('refuses anything that is not an object', () => {
    expect(() => migrateWorkspace('not a document')).toThrow(WorkspaceMigrationError);
  });
});
